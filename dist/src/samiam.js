"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Samiam = void 0;
// src/samiam.ts
const crypto_1 = require("crypto");
const LEVEL_ORDER = {
    debug: 0, info: 1, warn: 2, error: 3, fatal: 4,
};
class Samiam {
    config;
    logs = [];
    lastGrokCall = 0;
    activeSpans = new Map();
    grokInsights = new Map();
    transport;
    syncHandlers = [];
    statsData = {
        totalLogs: 0, grokCalls: 0, grokErrors: 0, grokSkipped: 0,
        adaptationsApplied: 0, lastGrokAt: 0, syncActionsApplied: 0,
    };
    grokQueue = Promise.resolve();
    learnedKnowledge = { lessons: [], lastAdaptedAt: '', adaptationCount: 0 };
    adaptiveTimer = null;
    logCountSinceReview = 0;
    isClosed = false;
    constructor(config = {}) {
        this.config = {
            grokApiKey: config.grokApiKey || process.env.GROK_API_KEY || '',
            grokEndpoint: config.grokEndpoint || 'https://api.x.ai/v1/chat/completions',
            grokModel: config.grokModel || 'grok-4.3',
            notifyOnLevels: config.notifyOnLevels || ['error', 'fatal'],
            minLevel: config.minLevel || 'debug',
            rateLimitMs: config.rateLimitMs ?? 1500,
            enableContinuousIteration: config.enableContinuousIteration ?? true,
            maxContextEntries: config.maxContextEntries ?? 1000,
            sanitizeKeys: config.sanitizeKeys || ['password', 'token', 'secret', 'apiKey'],
            enableAdaptiveMode: config.enableAdaptiveMode ?? false,
            adaptiveReviewIntervalMs: config.adaptiveReviewIntervalMs ?? 300_000,
            adaptiveReviewLogThreshold: config.adaptiveReviewLogThreshold ?? 200,
        };
        this.transport = (e) => {
            const method = e.level === 'fatal' ? 'error' : e.level;
            console[method](`[${e.timestamp}] [${e.level.toUpperCase()}] [${e.correlationId}] ${e.message}`, e.meta);
        };
        if (this.config.enableAdaptiveMode)
            this.startAdaptiveReview();
    }
    setTransport(fn) { this.transport = fn; }
    registerSyncHandler(handler) { this.syncHandlers.push(handler); }
    child(prefix, extraConfig = {}) {
        const child = new Samiam({ ...this.config, ...extraConfig });
        // Override transport to add prefix for console/output
        child.transport = (entry) => this.transport({
            ...entry,
            message: `[${prefix}] ${entry.message}`
        });
        // Also override the core log method so the returned entry.message contains the prefix
        const originalLog = child.log.bind(child);
        child.log = (level, message, meta = {}, correlationId) => {
            const prefixedMessage = `[${prefix}] ${message}`;
            return originalLog(level, prefixedMessage, meta, correlationId);
        };
        return child;
    }
    shouldLog(level) {
        return LEVEL_ORDER[level] >= LEVEL_ORDER[this.config.minLevel];
    }
    sanitize(meta, seen = new WeakSet()) {
        if (typeof meta !== 'object' || meta === null)
            return meta;
        if (seen.has(meta))
            return '[Circular]';
        seen.add(meta);
        const out = Array.isArray(meta) ? [] : {};
        for (const [k, v] of Object.entries(meta)) {
            if (this.config.sanitizeKeys.includes(k))
                out[k] = '[REDACTED]';
            else {
                try {
                    out[k] = this.sanitize(v, seen);
                }
                catch {
                    out[k] = '[Unserializable]';
                }
            }
        }
        return out;
    }
    log(level, message, meta = {}, correlationId) {
        if (!this.shouldLog(level))
            return null;
        const cid = correlationId || (0, crypto_1.randomUUID)();
        const entry = {
            id: (0, crypto_1.randomUUID)(),
            correlationId: cid,
            timestamp: new Date().toISOString(),
            level,
            message,
            meta: this.sanitize(meta),
            stack: ['error', 'fatal'].includes(level) ? new Error().stack : undefined,
        };
        this.logs.push(entry);
        if (this.logs.length > this.config.maxContextEntries)
            this.logs.shift();
        this.statsData.totalLogs++;
        this.logCountSinceReview++;
        this.transport(entry);
        if (this.config.notifyOnLevels.includes(level))
            this.enqueueGrok(entry);
        if (this.config.enableAdaptiveMode && this.logCountSinceReview >= this.config.adaptiveReviewLogThreshold) {
            this.triggerAdaptiveReview('log-threshold');
        }
        return entry;
    }
    debug(m, meta, cid) { return this.log('debug', m, meta, cid); }
    info(m, meta, cid) { return this.log('info', m, meta, cid); }
    warn(m, meta, cid) { return this.log('warn', m, meta, cid); }
    error(m, meta, cid) { return this.log('error', m, meta, cid); }
    fatal(m, meta, cid) { return this.log('fatal', m, meta, cid); }
    startSpan(name, correlationId) {
        const cid = correlationId || (0, crypto_1.randomUUID)();
        this.activeSpans.set(cid, Date.now());
        this.debug(`Span started: ${name}`, { span: name }, cid);
        return cid;
    }
    endSpan(correlationId, meta = {}) {
        const start = this.activeSpans.get(correlationId);
        if (start) {
            const duration = Date.now() - start;
            this.info(`Span ended`, { ...meta, durationMs: duration }, correlationId);
            this.activeSpans.delete(correlationId);
        }
    }
    timer(name, correlationId) {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            this.info(`Timer: ${name}`, { durationMs: duration }, correlationId);
            return duration;
        };
    }
    wrap(fn, name = fn.name || 'anonymous') {
        return ((...args) => {
            const cid = (0, crypto_1.randomUUID)();
            try {
                const result = fn(...args);
                return result instanceof Promise
                    ? result.catch((err) => {
                        this.error(`Error in ${name}`, { args: this.sanitize(args), error: err.message }, cid);
                        throw err;
                    })
                    : result;
            }
            catch (err) {
                this.error(`Error in ${name}`, { args: this.sanitize(args), error: err.message }, cid);
                throw err;
            }
        });
    }
    getStats() {
        return { ...this.statsData, bufferSize: this.logs.length, learnedLessons: this.learnedKnowledge.lessons.length };
    }
    getRecentLogs(count = 50, level) {
        const filtered = level ? this.logs.filter(l => l.level === level) : this.logs;
        return filtered.slice(-count);
    }
    getInsight(correlationId) { return this.grokInsights.get(correlationId); }
    getLearnedKnowledge() { return { ...this.learnedKnowledge }; }
    getSyncState() { return { config: this.config, stats: this.getStats(), learned: this.learnedKnowledge }; }
    // === Synchronized Adaptive Layer ===
    startAdaptiveReview() {
        if (this.adaptiveTimer)
            clearInterval(this.adaptiveTimer);
        this.adaptiveTimer = setInterval(() => this.triggerAdaptiveReview('timed'), this.config.adaptiveReviewIntervalMs);
    }
    stopAdaptiveReview() {
        if (this.adaptiveTimer) {
            clearInterval(this.adaptiveTimer);
            this.adaptiveTimer = null;
        }
    }
    async forceAdaptiveReview(reason = 'manual') { await this.triggerAdaptiveReview(reason); }
    async syncState(reason = 'manual') {
        if (!this.config.grokApiKey)
            return;
        const state = this.getSyncState();
        const prompt = `Synchronize with current debugger/logger state (0↔∞ mindset). Return JSON with adaptations and syncActions.
State: ${JSON.stringify(state)}`;
        // reuse the same Grok call path
        await this.callGrokForSync(prompt, 'sync-state');
    }
    async triggerAdaptiveReview(reason) {
        this.logCountSinceReview = 0;
        if (!this.config.grokApiKey || !this.config.enableAdaptiveMode)
            return;
        const summary = {
            totalLogs: this.statsData.totalLogs,
            recentErrors: this.logs.filter(l => ['error', 'fatal'].includes(l.level)).slice(-10),
            config: this.config,
            learnedLessons: this.learnedKnowledge.lessons.slice(-5),
            stats: this.getStats(),
        };
        const prompt = `You are the synchronized debugger/logger + Grok system (0↔∞). Analyze and return JSON:
{
  "adaptations": { ... },
  "learnedLessons": [...],
  "syncActions": [{"type":"...","payload":...,"reason":"..."}],
  "reasoning": "..."
}
Summary: ${JSON.stringify(summary)}`;
        await this.callGrokForSync(prompt, reason);
    }
    async callGrokForSync(prompt, reason) {
        try {
            const res = await fetch(this.config.grokEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.config.grokApiKey}` },
                body: JSON.stringify({
                    model: this.config.grokModel,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 900,
                }),
            });
            if (!res.ok)
                throw new Error(`Grok ${res.status}`);
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content || '';
            const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
            if (parsed.adaptations)
                this.applyAdaptations(parsed.adaptations, reason);
            if (parsed.learnedLessons?.length)
                this.learnedKnowledge.lessons.push(...parsed.learnedLessons);
            if (parsed.syncActions)
                await this.applySyncActions(parsed.syncActions, reason);
            this.learnedKnowledge.lastAdaptedAt = new Date().toISOString();
            this.learnedKnowledge.adaptationCount++;
            console.info('[Samiam] Sync/Adaptive review completed', { reason });
        }
        catch (err) {
            console.error('[Samiam] Sync call failed:', err.message);
        }
    }
    applyAdaptations(adapt, reason) {
        let applied = false;
        if (adapt.minLevel && LEVEL_ORDER[adapt.minLevel] >= LEVEL_ORDER[this.config.minLevel]) {
            this.config.minLevel = adapt.minLevel;
            applied = true;
        }
        if (adapt.notifyOnLevels?.length) {
            this.config.notifyOnLevels = [...new Set([...this.config.notifyOnLevels, ...adapt.notifyOnLevels])];
            applied = true;
        }
        if (adapt.sanitizeKeys?.length) {
            this.config.sanitizeKeys = [...new Set([...this.config.sanitizeKeys, ...adapt.sanitizeKeys])];
            applied = true;
        }
        if (typeof adapt.rateLimitMs === 'number' && adapt.rateLimitMs > 500) {
            this.config.rateLimitMs = adapt.rateLimitMs;
            applied = true;
        }
        if (applied) {
            this.statsData.adaptationsApplied++;
            this.log('info', 'Live adaptation applied', { reason, adaptations: adapt }, 'system-sync');
        }
    }
    async applySyncActions(actions, reason) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'changeMinLevel':
                        if (action.payload && LEVEL_ORDER[action.payload] !== undefined) {
                            this.config.minLevel = action.payload;
                        }
                        break;
                    // ... all other cases unchanged
                    case 'addNotifyLevel':
                        if (action.payload)
                            this.config.notifyOnLevels.push(action.payload);
                        break;
                    case 'updateRateLimit':
                        if (typeof action.payload === 'number')
                            this.config.rateLimitMs = action.payload;
                        break;
                    case 'addSanitizeKey':
                        if (action.payload)
                            this.config.sanitizeKeys.push(action.payload);
                        break;
                    case 'logPattern':
                        this.info('Grok-detected pattern', { pattern: action.payload, reason: action.reason }, 'system-sync');
                        break;
                    case 'custom':
                        for (const h of this.syncHandlers)
                            await h(action);
                        break;
                }
                this.statsData.syncActionsApplied++;
                this.log('info', `Sync action applied: ${action.type}`, { action, reason }, 'system-sync');
            }
            catch (e) {
                this.error('Sync action failed', { action, error: e.message }, 'system-sync');
            }
        }
    }
    async close() {
        this.isClosed = true;
        this.stopAdaptiveReview();
        if (this.config.enableAdaptiveMode && this.config.grokApiKey) {
            await this.triggerAdaptiveReview('shutdown');
        }
        this.logs.length = 0;
        this.activeSpans.clear();
        this.grokInsights.clear();
        this.grokQueue = Promise.resolve(); // clear pending queue
    }
    enqueueGrok(entry) {
        if (this.isClosed)
            return;
        this.grokQueue = this.grokQueue.then(() => this.notifyGrok(entry)).catch(() => { });
    }
    async notifyGrok(entry) {
        if (this.isClosed || !this.config.grokApiKey)
            return;
        const now = Date.now();
        if (now - this.lastGrokCall < this.config.rateLimitMs) {
            this.statsData.grokSkipped++;
            return;
        }
        this.lastGrokCall = now;
        this.statsData.grokCalls++;
        this.statsData.lastGrokAt = now;
        const context = this.logs.slice(-30);
        const knowledgePrefix = this.learnedKnowledge.lessons.length
            ? `Learned lessons: ${this.learnedKnowledge.lessons.slice(-5).join(' | ')}\n`
            : '';
        const syncContext = `Current config: ${JSON.stringify(this.config)}\nStats: ${JSON.stringify(this.getStats())}`;
        const prompt = this.config.enableContinuousIteration
            ? `${knowledgePrefix}${syncContext}You are the synchronized debugger/logger + Grok system (0↔∞). Analyze and return JSON with rootCause, fixes[], nextPrompt, adaptations, and optional syncActions.
Entry: ${JSON.stringify(entry)}
Context: ${JSON.stringify(context)}`
            : `Analyze: ${JSON.stringify(entry)}`;
        try {
            const res = await fetch(this.config.grokEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.config.grokApiKey}` },
                body: JSON.stringify({
                    model: this.config.grokModel,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 1300,
                }),
            });
            if (!res.ok)
                throw new Error(`Grok HTTP ${res.status}`);
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content || '';
            let insight = { raw: content };
            try {
                const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
                insight = { ...parsed, raw: content };
                if (parsed.adaptations)
                    this.applyAdaptations(parsed.adaptations, 'grok-insight');
                if (parsed.syncActions)
                    await this.applySyncActions(parsed.syncActions, 'grok-insight');
            }
            catch { }
            this.grokInsights.set(entry.correlationId, insight);
            console.info('[Samiam] Grok insight stored', { id: entry.id, correlationId: entry.correlationId });
        }
        catch (err) {
            this.statsData.grokErrors++;
            if (!this.isClosed) {
                console.error('[Samiam] Grok call failed:', err.message);
            }
        }
    }
}
exports.Samiam = Samiam;
exports.default = Samiam;
//# sourceMappingURL=samiam.js.map