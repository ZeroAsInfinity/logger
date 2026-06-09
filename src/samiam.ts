// src/samiam.ts
import { randomUUID } from 'crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type OperatingProfile = 'conservative' | 'balanced' | 'aggressive';
export type SamiamWorkloadType = 'api' | 'worker' | 'batch' | 'realtime';
export type SamiamRuntimeEnvironment = 'dev' | 'staging' | 'prod';
export type AiEngagementMode = 'off' | 'viability-gated' | 'always-on';
export type AiEngagementStage = 'investigate' | 'revise' | 'repair' | 'audit' | 'append';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3, fatal: 4,
};

export interface SamiamConfig {
  grokApiKey?: string;
  grokEndpoint?: string;
  grokModel?: string;
  notifyOnLevels?: LogLevel[];
  minLevel?: LogLevel;
  rateLimitMs?: number;
  enableContinuousIteration?: boolean;
  maxContextEntries?: number;
  sanitizeKeys?: string[];
  enableAdaptiveMode?: boolean;
  adaptiveReviewIntervalMs?: number;
  adaptiveReviewLogThreshold?: number;
  strictSyncMode?: boolean;
  allowCustomSyncActions?: boolean;
  maxLearnedLessons?: number;
  maxInsightEntries?: number;
  aiRequestTimeoutMs?: number;
  aiMaxRetries?: number;
  aiRetryBaseDelayMs?: number;
  maxPromptContextEntries?: number;
  captureErrorStack?: boolean;
  minRateLimitMs?: number;
  maxRateLimitMs?: number;
  aiCircuitBreakerFailures?: number;
  aiCircuitBreakerCooldownMs?: number;
  operatingProfile?: OperatingProfile;
  maxQualitySnapshots?: number;
  aiEngagementMode?: AiEngagementMode;
  aiInvestigateErrorRatioThreshold?: number;
  aiInvestigateMinRecentErrors?: number;
  runtimeEnvironment?: SamiamRuntimeEnvironment;
  enforceEnvironmentAiPolicy?: boolean;
}

export interface SamiamEnvironmentAiPolicy {
  environment: SamiamRuntimeEnvironment;
  aiEngagementMode: AiEngagementMode;
  aiInvestigateErrorRatioThreshold: number;
  aiInvestigateMinRecentErrors: number;
  allowForceAdaptiveReview: boolean;
  allowForceSyncState: boolean;
}

export interface AiEngagementDecision {
  engage: boolean;
  stage: AiEngagementStage;
  intents: AiEngagementStage[];
  reason: string;
}

export interface SamiamQualityMetrics {
  totalConsidered: number;
  actionableCount: number;
  noiseCount: number;
  errorCount: number;
  warnCount: number;
  noiseRatio: number;
  actionableAlertPrecision: number;
}

export interface SamiamQualitySnapshot {
  timestamp: string;
  label: string;
  metrics: SamiamQualityMetrics;
  health: SamiamHealth;
  stats: SamiamStats;
  delta?: {
    noiseRatio: number;
    actionableAlertPrecision: number;
  };
}

export interface SamiamQualityMetricsOptions {
  recentLogCount?: number;
  actionableLevels?: LogLevel[];
  noiseLevels?: LogLevel[];
}

export interface SamiamQualityGuardPolicy {
  workload: SamiamWorkloadType | 'custom';
  maxNoiseRatio: number;
  minActionableAlertPrecision: number;
  maxNoiseRatioIncrease: number;
  maxActionablePrecisionDrop: number;
  minSamples: number;
}

export interface SamiamQualityGuardResult {
  ready: boolean;
  passed: boolean;
  evaluatedAt: string;
  policy: SamiamQualityGuardPolicy;
  baseline?: SamiamQualitySnapshot;
  current?: SamiamQualitySnapshot;
  violations: string[];
  summary: string;
}

export interface SamiamHealth {
  operatingProfile: OperatingProfile;
  isClosed: boolean;
  pendingAiTasks: number;
  aiCircuitOpen: boolean;
  aiCircuitOpenUntil: number;
  aiConsecutiveFailures: number;
  bufferUtilization: number;
}

export interface SamiamLoggingPolicy {
  workload: SamiamWorkloadType;
  minLevel: LogLevel;
  notifyOnLevels: LogLevel[];
  operatingProfile: OperatingProfile;
  adaptiveReviewLogThreshold: number;
  rateLimitMs: number;
}

export interface SamiamStats {
  totalLogs: number;
  grokCalls: number;
  grokErrors: number;
  grokSkipped: number;
  adaptationsApplied: number;
  lastGrokAt: number;
  syncActionsApplied: number;
  aiCircuitOpenSkips: number;
  aiRetryAttempts: number;
  aiCircuitTrips: number;
  aiPolicySkips: number;
  bufferSize: number;
  learnedLessons: number;
}

export interface SamiamTriageSnapshot {
  timestamp: string;
  label: string;
  health: SamiamHealth;
  stats: SamiamStats;
  recentLogs: LogEntry[];
  recentErrors: LogEntry[];
  channels?: Array<ReturnType<Samiam['getChannelStats']>>;
  notes?: {
    hypothesis?: string;
    change?: string;
    result?: string;
  };
}

export interface SamiamTriageSnapshotOptions {
  label?: string;
  recentLogCount?: number;
  recentErrorCount?: number;
  channels?: string[];
  notes?: {
    hypothesis?: string;
    change?: string;
    result?: string;
  };
}

export type SamiamRecommendationPriority = 'high' | 'medium' | 'low';

export interface SamiamTriageRecommendation {
  id: string;
  title: string;
  why: string;
  action: string;
  priority: SamiamRecommendationPriority;
  metric?: string;
}

export interface SamiamIncidentRunbook {
  generatedAt: string;
  label: string;
  baseline: SamiamTriageSnapshot;
  hypothesis: string;
  changePlan: string;
  resultPlan: string;
  checklist: string[];
  recommendations: SamiamTriageRecommendation[];
}

export interface SamiamIncidentRunbookOptions extends SamiamTriageSnapshotOptions {
  hypothesis?: string;
  changePlan?: string;
  resultPlan?: string;
}

export type SamiamTroubleshootingTopic = 'general' | 'ai-failures' | 'noise' | 'triage' | 'sync';

export type SamiamEventName =
  | 'profileChanged'
  | 'adaptationApplied'
  | 'syncActionApplied'
  | 'aiCircuitOpen'
  | 'aiCallFailed'
  | 'aiEngagementEvaluated';

export interface SamiamEvent {
  name: SamiamEventName;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface LogEntry {
  id: string;
  correlationId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  meta: Record<string, any>;
  durationMs?: number;
  stack?: string;
}

export interface GrokInsight {
  rootCause?: string;
  fixes?: string[];
  nextPrompt?: string;
  raw?: string;
}

export interface SyncAction {
  type: 'changeMinLevel' | 'addNotifyLevel' | 'updateRateLimit' | 'addSanitizeKey' | 'logPattern' | 'custom';
  payload: any;
  reason?: string;
}

export interface Adaptation {
  minLevel?: LogLevel;
  notifyOnLevels?: LogLevel[];
  sanitizeKeys?: string[];
  rateLimitMs?: number;
  learnedLessons?: string[];
  syncActions?: SyncAction[];
}

export interface LearnedKnowledge {
  lessons: string[];
  lastAdaptedAt: string;
  adaptationCount: number;
}

export type LogTransport = (entry: LogEntry) => void | Promise<void>;
export type SyncHandler = (action: SyncAction, entry?: LogEntry) => void | Promise<void>;
export type AiRequestOptions = { timeoutMs?: number };
export type AiProvider = (prompt: string, config: Required<SamiamConfig>, options?: AiRequestOptions) => Promise<string>;
export type SamiamEventHandler = (event: SamiamEvent) => void | Promise<void>;

export interface SamiamNamespaceLogger {
  debug(message: string, meta?: any, correlationId?: string): LogEntry | null;
  info(message: string, meta?: any, correlationId?: string): LogEntry | null;
  warn(message: string, meta?: any, correlationId?: string): LogEntry | null;
  error(message: string, meta?: any, correlationId?: string): LogEntry | null;
  fatal(message: string, meta?: any, correlationId?: string): LogEntry | null;
  child(prefix: string): SamiamNamespaceLogger;
  getStats(): SamiamStats;
  getChannelStats(): ReturnType<Samiam['getChannelStats']>;
  getHealth(): SamiamHealth;
  close(): Promise<void>;
}

const WORKLOAD_POLICY_PRESETS: Record<SamiamWorkloadType, Omit<SamiamLoggingPolicy, 'workload'>> = {
  api: {
    minLevel: 'info',
    notifyOnLevels: ['error', 'fatal'],
    operatingProfile: 'balanced',
    adaptiveReviewLogThreshold: 200,
    rateLimitMs: 1500,
  },
  worker: {
    minLevel: 'warn',
    notifyOnLevels: ['fatal'],
    operatingProfile: 'conservative',
    adaptiveReviewLogThreshold: 450,
    rateLimitMs: 2500,
  },
  batch: {
    minLevel: 'info',
    notifyOnLevels: ['warn', 'error', 'fatal'],
    operatingProfile: 'balanced',
    adaptiveReviewLogThreshold: 300,
    rateLimitMs: 2000,
  },
  realtime: {
    minLevel: 'warn',
    notifyOnLevels: ['error', 'fatal'],
    operatingProfile: 'conservative',
    adaptiveReviewLogThreshold: 500,
    rateLimitMs: 3000,
  },
};

const QUALITY_GUARD_PRESETS: Record<SamiamWorkloadType, Omit<SamiamQualityGuardPolicy, 'workload'>> = {
  api: {
    maxNoiseRatio: 0.55,
    minActionableAlertPrecision: 0.2,
    maxNoiseRatioIncrease: 0.08,
    maxActionablePrecisionDrop: 0.06,
    minSamples: 30,
  },
  worker: {
    maxNoiseRatio: 0.45,
    minActionableAlertPrecision: 0.25,
    maxNoiseRatioIncrease: 0.07,
    maxActionablePrecisionDrop: 0.05,
    minSamples: 40,
  },
  batch: {
    maxNoiseRatio: 0.6,
    minActionableAlertPrecision: 0.15,
    maxNoiseRatioIncrease: 0.1,
    maxActionablePrecisionDrop: 0.08,
    minSamples: 25,
  },
  realtime: {
    maxNoiseRatio: 0.5,
    minActionableAlertPrecision: 0.3,
    maxNoiseRatioIncrease: 0.06,
    maxActionablePrecisionDrop: 0.05,
    minSamples: 50,
  },
};

const ENVIRONMENT_AI_POLICY_PRESETS: Record<SamiamRuntimeEnvironment, Omit<SamiamEnvironmentAiPolicy, 'environment'>> = {
  dev: {
    aiEngagementMode: 'always-on',
    aiInvestigateErrorRatioThreshold: 0.15,
    aiInvestigateMinRecentErrors: 1,
    allowForceAdaptiveReview: true,
    allowForceSyncState: true,
  },
  staging: {
    aiEngagementMode: 'viability-gated',
    aiInvestigateErrorRatioThreshold: 0.2,
    aiInvestigateMinRecentErrors: 2,
    allowForceAdaptiveReview: true,
    allowForceSyncState: true,
  },
  prod: {
    aiEngagementMode: 'viability-gated',
    aiInvestigateErrorRatioThreshold: 0.35,
    aiInvestigateMinRecentErrors: 4,
    allowForceAdaptiveReview: false,
    allowForceSyncState: false,
  },
};

export class Samiam {
  private config: Required<SamiamConfig>;
  private logs: LogEntry[] = [];
  private lastGrokCall = 0;
  private activeSpans = new Map<string, number>();
  private grokInsights = new Map<string, GrokInsight>();
  private transport: LogTransport;
  private syncHandlers: SyncHandler[] = [];
  private statsData = {
    totalLogs: 0, grokCalls: 0, grokErrors: 0, grokSkipped: 0,
    adaptationsApplied: 0, lastGrokAt: 0, syncActionsApplied: 0,
    aiCircuitOpenSkips: 0,
    aiRetryAttempts: 0,
    aiCircuitTrips: 0,
    aiPolicySkips: 0,
  };
  private grokQueue: Promise<void> = Promise.resolve();
  private learnedKnowledge: LearnedKnowledge = { lessons: [], lastAdaptedAt: '', adaptationCount: 0 };
  private adaptiveTimer: NodeJS.Timeout | null = null;
  private logCountSinceReview = 0;
  private isClosed = false;
  private sanitizeKeySetLower = new Set<string>();
  private aiProvider: AiProvider;
  private aiConsecutiveFailures = 0;
  private aiCircuitOpenUntil = 0;
  private pendingAiTasks = 0;
  private eventHandlers = new Map<SamiamEventName, Set<SamiamEventHandler>>();
  private qualitySnapshots: SamiamQualitySnapshot[] = [];

  private readonly syncActionTypes = new Set<SyncAction['type']>([
    'changeMinLevel',
    'addNotifyLevel',
    'updateRateLimit',
    'addSanitizeKey',
    'logPattern',
    'custom',
  ]);

  private isValidLevel(value: unknown): value is LogLevel {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LEVEL_ORDER, value);
  }

  private isSensitiveKey(key: string): boolean {
    return this.sanitizeKeySetLower.has(key.toLowerCase());
  }

  private rebuildSanitizeKeySet() {
    this.sanitizeKeySetLower = new Set(this.config.sanitizeKeys.map((k) => k.toLowerCase()));
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private toErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }

  private isAiCircuitOpen(now = Date.now()): boolean {
    return now < this.aiCircuitOpenUntil;
  }

  private markAiAttemptSuccess() {
    this.aiConsecutiveFailures = 0;
  }

  private markAiAttemptFailure() {
    this.aiConsecutiveFailures += 1;
    if (this.aiConsecutiveFailures >= this.config.aiCircuitBreakerFailures) {
      this.aiCircuitOpenUntil = Date.now() + this.config.aiCircuitBreakerCooldownMs;
      this.aiConsecutiveFailures = 0;
      this.statsData.aiCircuitTrips++;
      this.emitEvent('aiCircuitOpen', {
        cooldownMs: this.config.aiCircuitBreakerCooldownMs,
        openUntil: this.aiCircuitOpenUntil,
      });
    }
  }

  private emitEvent(name: SamiamEventName, data?: Record<string, unknown>) {
    const handlers = this.eventHandlers.get(name);
    if (!handlers?.size) return;

    const event: SamiamEvent = {
      name,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const handler of handlers) {
      Promise.resolve(handler(event)).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[Samiam] Event handler failed:', message);
      });
    }
  }

  private applyOperatingProfile(profile: OperatingProfile, preserveExplicit?: Partial<SamiamConfig>) {
    if (!['conservative', 'balanced', 'aggressive'].includes(profile)) {
      profile = 'balanced';
    }
    const shouldSet = (key: keyof SamiamConfig) => !preserveExplicit || preserveExplicit[key] === undefined;

    if (profile === 'conservative') {
      if (shouldSet('minLevel')) this.config.minLevel = 'info';
      if (shouldSet('rateLimitMs')) this.config.rateLimitMs = 2500;
      if (shouldSet('minRateLimitMs')) this.config.minRateLimitMs = 250;
      if (shouldSet('maxRateLimitMs')) this.config.maxRateLimitMs = 90_000;
      if (shouldSet('aiMaxRetries')) this.config.aiMaxRetries = 1;
      if (shouldSet('adaptiveReviewLogThreshold')) this.config.adaptiveReviewLogThreshold = 400;
      if (shouldSet('aiCircuitBreakerFailures')) this.config.aiCircuitBreakerFailures = 2;
      if (shouldSet('aiCircuitBreakerCooldownMs')) this.config.aiCircuitBreakerCooldownMs = 45_000;
    }

    if (profile === 'balanced') {
      if (shouldSet('minLevel')) this.config.minLevel = 'debug';
      if (shouldSet('rateLimitMs')) this.config.rateLimitMs = 1500;
      if (shouldSet('minRateLimitMs')) this.config.minRateLimitMs = 100;
      if (shouldSet('maxRateLimitMs')) this.config.maxRateLimitMs = 60_000;
      if (shouldSet('aiMaxRetries')) this.config.aiMaxRetries = 2;
      if (shouldSet('adaptiveReviewLogThreshold')) this.config.adaptiveReviewLogThreshold = 200;
      if (shouldSet('aiCircuitBreakerFailures')) this.config.aiCircuitBreakerFailures = 3;
      if (shouldSet('aiCircuitBreakerCooldownMs')) this.config.aiCircuitBreakerCooldownMs = 30_000;
    }

    if (profile === 'aggressive') {
      if (shouldSet('minLevel')) this.config.minLevel = 'debug';
      if (shouldSet('rateLimitMs')) this.config.rateLimitMs = 700;
      if (shouldSet('minRateLimitMs')) this.config.minRateLimitMs = 75;
      if (shouldSet('maxRateLimitMs')) this.config.maxRateLimitMs = 25_000;
      if (shouldSet('aiMaxRetries')) this.config.aiMaxRetries = 3;
      if (shouldSet('adaptiveReviewLogThreshold')) this.config.adaptiveReviewLogThreshold = 100;
      if (shouldSet('aiCircuitBreakerFailures')) this.config.aiCircuitBreakerFailures = 4;
      if (shouldSet('aiCircuitBreakerCooldownMs')) this.config.aiCircuitBreakerCooldownMs = 20_000;
    }

    this.config.operatingProfile = profile;
    this.config.maxPromptContextEntries = this.clamp(this.config.maxPromptContextEntries, 5, this.config.maxContextEntries);
    this.config.rateLimitMs = this.normalizeRateLimitMs(this.config.rateLimitMs);
  }

  private applyEnvironmentAiPolicy(environment: SamiamRuntimeEnvironment, preserveExplicit?: Partial<SamiamConfig>) {
    const preset = ENVIRONMENT_AI_POLICY_PRESETS[environment];
    if (!preset) throw new TypeError('Invalid runtime environment');

    const shouldSet = (key: keyof SamiamConfig) => !preserveExplicit || preserveExplicit[key] === undefined;

    this.config.runtimeEnvironment = environment;
    if (shouldSet('aiEngagementMode')) this.config.aiEngagementMode = preset.aiEngagementMode;
    if (shouldSet('aiInvestigateErrorRatioThreshold')) {
      this.config.aiInvestigateErrorRatioThreshold = preset.aiInvestigateErrorRatioThreshold;
    }
    if (shouldSet('aiInvestigateMinRecentErrors')) {
      this.config.aiInvestigateMinRecentErrors = preset.aiInvestigateMinRecentErrors;
    }
  }

  private normalizeRateLimitMs(value: number): number {
    const min = Math.max(50, this.config.minRateLimitMs);
    const max = Math.max(min, this.config.maxRateLimitMs);
    return this.clamp(value, min, max);
  }

  private shouldRunAiForStage(stage: AiEngagementStage, details?: { reason?: string; entry?: LogEntry; force?: boolean }): AiEngagementDecision {
    const mode = this.config.aiEngagementMode;

    if (!this.config.grokApiKey) {
      return { engage: false, stage, intents: [stage], reason: 'Missing AI key' };
    }
    if (this.isClosed) {
      return { engage: false, stage, intents: [stage], reason: 'Logger is closed' };
    }
    if (this.isAiCircuitOpen()) {
      return { engage: false, stage, intents: [stage], reason: 'AI circuit is open' };
    }
    if (mode === 'off') {
      return { engage: false, stage, intents: [stage], reason: 'AI engagement mode is off' };
    }
    if (mode === 'always-on') {
      return { engage: true, stage, intents: [stage], reason: 'AI engagement mode is always-on' };
    }

    if (details?.force) {
      return {
        engage: true,
        stage,
        intents: [stage, 'append'],
        reason: 'Force flag set by operator-driven flow',
      };
    }

    if (stage === 'investigate') {
      const level = details?.entry?.level;
      if (level === 'error' || level === 'fatal') {
        return {
          engage: true,
          stage,
          intents: ['investigate', 'repair', 'append'],
          reason: `High-severity entry detected: ${level}`,
        };
      }

      const recentLogs = this.getRecentLogs(30);
      const recentErrors = recentLogs.filter((entry) => entry.level === 'error' || entry.level === 'fatal').length;
      const recentErrorRatio = recentLogs.length ? recentErrors / recentLogs.length : 0;

      if (recentErrors >= this.config.aiInvestigateMinRecentErrors || recentErrorRatio >= this.config.aiInvestigateErrorRatioThreshold) {
        return {
          engage: true,
          stage,
          intents: ['investigate', 'append'],
          reason: `Error pressure detected (errors=${recentErrors}, ratio=${recentErrorRatio.toFixed(2)})`,
        };
      }

      return {
        engage: false,
        stage,
        intents: ['investigate'],
        reason: 'Investigate criteria not met; continue autonomous logger/debugger flow',
      };
    }

    if (stage === 'revise' || stage === 'repair') {
      const reason = details?.reason ?? '';
      if (reason === 'manual' || reason === 'shutdown') {
        return {
          engage: true,
          stage,
          intents: ['revise', 'repair', 'append'],
          reason: `Operator-forced review: ${reason}`,
        };
      }

      const qualityGuard = this.evaluateQualityGuard();
      if (qualityGuard.ready && !qualityGuard.passed) {
        return {
          engage: true,
          stage,
          intents: ['revise', 'repair', 'audit', 'append'],
          reason: 'Quality guard failed; AI may help propose bounded revisions',
        };
      }

      const recentErrors = this.getRecentLogs(20, 'error').length;
      if (recentErrors >= this.config.aiInvestigateMinRecentErrors) {
        return {
          engage: true,
          stage,
          intents: ['revise', 'repair', 'append'],
          reason: `Recent error count ${recentErrors} reached revision threshold`,
        };
      }

      return {
        engage: false,
        stage,
        intents: [stage],
        reason: 'Revision/repair criteria not met; retain current autonomous controls',
      };
    }

    if (stage === 'audit') {
      const hasHistory = this.qualitySnapshots.length > 1;
      const latest = this.qualitySnapshots.length ? this.qualitySnapshots[this.qualitySnapshots.length - 1] : undefined;
      if (hasHistory && latest && latest.metrics.totalConsidered >= 10) {
        return {
          engage: true,
          stage,
          intents: ['audit', 'append'],
          reason: 'Quality history available for AI-assisted audit',
        };
      }
      return {
        engage: false,
        stage,
        intents: ['audit'],
        reason: 'Not enough quality history for meaningful audit',
      };
    }

    const hasRecentErrors = this.getRecentLogs(15, 'error').length > 0;
    if (hasRecentErrors && this.learnedKnowledge.lessons.length < this.config.maxLearnedLessons) {
      return {
        engage: true,
        stage,
        intents: ['append'],
        reason: 'Recent errors present and learned-lesson budget available',
      };
    }

    return {
      engage: false,
      stage,
      intents: ['append'],
      reason: 'No viable append signal detected',
    };
  }

  private evaluateAndEmitAiEngagement(stage: AiEngagementStage, details?: { reason?: string; entry?: LogEntry; force?: boolean }): AiEngagementDecision {
    const decision = this.shouldRunAiForStage(stage, details);
    this.emitEvent('aiEngagementEvaluated', {
      stage,
      engage: decision.engage,
      intents: decision.intents,
      reason: decision.reason,
      triggerReason: details?.reason,
      force: !!details?.force,
      entryLevel: details?.entry?.level,
      correlationId: details?.entry?.correlationId,
    });
    if (!decision.engage) {
      if (decision.reason === 'AI circuit is open') this.statsData.aiCircuitOpenSkips++;
      else this.statsData.aiPolicySkips++;
    }
    return decision;
  }

  private async requestAiWithRetry(prompt: string): Promise<string> {
    if (this.isAiCircuitOpen()) {
      this.statsData.aiCircuitOpenSkips++;
      throw new Error('AI circuit breaker is open');
    }

    const maxAttempts = Math.max(1, this.config.aiMaxRetries + 1);
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.aiProvider(prompt, this.config, { timeoutMs: this.config.aiRequestTimeoutMs });
        this.markAiAttemptSuccess();
        return result;
      } catch (err) {
        lastError = err;
        this.markAiAttemptFailure();
        if (attempt >= maxAttempts) break;
        this.statsData.aiRetryAttempts++;
        const delay = this.config.aiRetryBaseDelayMs * attempt;
        await this.sleep(delay);
      }
    }
    throw lastError instanceof Error ? lastError : new Error('AI provider call failed');
  }

  private readonly defaultAiProvider: AiProvider = async (prompt, config, options) => {
    const timeoutMs = options?.timeoutMs ?? config.aiRequestTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(config.grokEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.grokApiKey}` },
        body: JSON.stringify({
          model: config.grokModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 1300,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Grok HTTP ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`AI request timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  private mergeUniqueLevels(current: LogLevel[], incoming: LogLevel[]): LogLevel[] {
    const seen = new Set<LogLevel>(current);
    for (const level of incoming) {
      if (this.isValidLevel(level)) seen.add(level);
    }
    return [...seen];
  }

  private mergeUniqueSanitizeKeys(current: string[], incoming: string[]): string[] {
    const merged = [...current];
    const seenLower = new Set(current.map((k) => k.toLowerCase()));
    for (const key of incoming) {
      const normalized = key.toLowerCase();
      if (!seenLower.has(normalized)) {
        merged.push(key);
        seenLower.add(normalized);
      }
    }
    return merged;
  }

  private extractJsonCandidate(content: string): string {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return fenced[1].trim();

    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return content.slice(firstBrace, lastBrace + 1).trim();
    }
    return content.trim();
  }

  private parseGrokPayload(content: string): Record<string, unknown> | null {
    const candidate = this.extractJsonCandidate(content);
    if (!candidate) return null;
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  private normalizeLearnedLessons(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const lessons = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return [...new Set(lessons)];
  }

  private normalizeAdaptation(value: unknown): Adaptation | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const raw = value as Record<string, unknown>;
    const out: Adaptation = {};

    if (this.isValidLevel(raw.minLevel)) out.minLevel = raw.minLevel;
    if (Array.isArray(raw.notifyOnLevels)) {
      out.notifyOnLevels = raw.notifyOnLevels.filter((level): level is LogLevel => this.isValidLevel(level));
    }
    if (Array.isArray(raw.sanitizeKeys)) {
      out.sanitizeKeys = raw.sanitizeKeys
        .filter((key): key is string => typeof key === 'string')
        .map((key) => key.trim())
        .filter(Boolean);
    }
    if (typeof raw.rateLimitMs === 'number' && Number.isFinite(raw.rateLimitMs)) {
      out.rateLimitMs = raw.rateLimitMs;
    }

    if (out.minLevel || out.notifyOnLevels?.length || out.sanitizeKeys?.length || typeof out.rateLimitMs === 'number') {
      return out;
    }
    return null;
  }

  private normalizeSyncActions(value: unknown): SyncAction[] {
    if (!Array.isArray(value)) return [];
    const actions: SyncAction[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const raw = item as Record<string, unknown>;
      if (!this.syncActionTypes.has(raw.type as SyncAction['type'])) continue;
      if (this.config.strictSyncMode && raw.type === 'custom' && !this.config.allowCustomSyncActions) continue;
      const action: SyncAction = {
        type: raw.type as SyncAction['type'],
        payload: raw.payload,
      };
      if (typeof raw.reason === 'string' && raw.reason.trim()) action.reason = raw.reason.trim();
      actions.push(action);
    }
    return actions;
  }

  constructor(config: SamiamConfig = {}) {
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
      strictSyncMode: config.strictSyncMode ?? false,
      allowCustomSyncActions: config.allowCustomSyncActions ?? true,
      maxLearnedLessons: config.maxLearnedLessons ?? 500,
      maxInsightEntries: config.maxInsightEntries ?? 1000,
      aiRequestTimeoutMs: config.aiRequestTimeoutMs ?? 12_000,
      aiMaxRetries: config.aiMaxRetries ?? 2,
      aiRetryBaseDelayMs: config.aiRetryBaseDelayMs ?? 350,
      maxPromptContextEntries: config.maxPromptContextEntries ?? 30,
      captureErrorStack: config.captureErrorStack ?? true,
      minRateLimitMs: config.minRateLimitMs ?? 100,
      maxRateLimitMs: config.maxRateLimitMs ?? 60_000,
      aiCircuitBreakerFailures: config.aiCircuitBreakerFailures ?? 3,
      aiCircuitBreakerCooldownMs: config.aiCircuitBreakerCooldownMs ?? 30_000,
      operatingProfile: config.operatingProfile ?? 'balanced',
      maxQualitySnapshots: config.maxQualitySnapshots ?? 200,
      aiEngagementMode: config.aiEngagementMode ?? 'viability-gated',
      aiInvestigateErrorRatioThreshold: config.aiInvestigateErrorRatioThreshold ?? 0.25,
      aiInvestigateMinRecentErrors: config.aiInvestigateMinRecentErrors ?? 2,
      runtimeEnvironment: config.runtimeEnvironment ?? 'staging',
      enforceEnvironmentAiPolicy: config.enforceEnvironmentAiPolicy ?? false,
    };

    if (this.config.enforceEnvironmentAiPolicy) {
      this.applyEnvironmentAiPolicy(this.config.runtimeEnvironment, config);
    }

    this.applyOperatingProfile(this.config.operatingProfile, config);

    this.config.maxPromptContextEntries = this.clamp(this.config.maxPromptContextEntries, 5, this.config.maxContextEntries);
    this.config.rateLimitMs = this.normalizeRateLimitMs(this.config.rateLimitMs);

    this.rebuildSanitizeKeySet();
    this.aiProvider = this.defaultAiProvider;

    this.transport = (e) => {
      const method = e.level === 'fatal' ? 'error' : e.level;
      console[method](`[${e.timestamp}] [${e.level.toUpperCase()}] [${e.correlationId}] ${e.message}`, e.meta);
    };

    if (this.config.enableAdaptiveMode) this.startAdaptiveReview();
  }

  setTransport(fn: LogTransport) {
    if (typeof fn !== 'function') throw new TypeError('Transport must be a function');
    this.transport = fn;
  }
  setAiProvider(provider: AiProvider) {
    if (typeof provider !== 'function') throw new TypeError('AI provider must be a function');
    this.aiProvider = provider;
  }
  registerSyncHandler(handler: SyncHandler) {
    if (typeof handler !== 'function') throw new TypeError('Sync handler must be a function');
    this.syncHandlers.push(handler);
  }
  onEvent(name: SamiamEventName, handler: SamiamEventHandler): () => void {
    const handlers = this.eventHandlers.get(name) ?? new Set<SamiamEventHandler>();
    handlers.add(handler);
    this.eventHandlers.set(name, handlers);
    return () => this.offEvent(name, handler);
  }
  offEvent(name: SamiamEventName, handler: SamiamEventHandler) {
    const handlers = this.eventHandlers.get(name);
    if (!handlers) return;
    handlers.delete(handler);
    if (!handlers.size) this.eventHandlers.delete(name);
  }
  setOperatingProfile(profile: OperatingProfile) {
    if (!['conservative', 'balanced', 'aggressive'].includes(profile)) {
      throw new TypeError('Invalid operating profile');
    }
    const previous = this.config.operatingProfile;
    this.applyOperatingProfile(profile);
    if (previous !== profile) this.emitEvent('profileChanged', { previous, next: profile });
  }
  getOperatingProfile(): OperatingProfile { return this.config.operatingProfile; }

  static getLoggingPolicy(workload: SamiamWorkloadType): SamiamLoggingPolicy {
    const preset = WORKLOAD_POLICY_PRESETS[workload];
    if (!preset) throw new TypeError('Invalid workload type');
    return {
      workload,
      minLevel: preset.minLevel,
      notifyOnLevels: [...preset.notifyOnLevels],
      operatingProfile: preset.operatingProfile,
      adaptiveReviewLogThreshold: preset.adaptiveReviewLogThreshold,
      rateLimitMs: preset.rateLimitMs,
    };
  }

  static getQualityGuardPolicy(workload: SamiamWorkloadType): SamiamQualityGuardPolicy {
    const preset = QUALITY_GUARD_PRESETS[workload];
    if (!preset) throw new TypeError('Invalid workload type');
    return {
      workload,
      maxNoiseRatio: preset.maxNoiseRatio,
      minActionableAlertPrecision: preset.minActionableAlertPrecision,
      maxNoiseRatioIncrease: preset.maxNoiseRatioIncrease,
      maxActionablePrecisionDrop: preset.maxActionablePrecisionDrop,
      minSamples: preset.minSamples,
    };
  }

  static getEnvironmentAiPolicy(environment: SamiamRuntimeEnvironment): SamiamEnvironmentAiPolicy {
    const preset = ENVIRONMENT_AI_POLICY_PRESETS[environment];
    if (!preset) throw new TypeError('Invalid runtime environment');
    return {
      environment,
      aiEngagementMode: preset.aiEngagementMode,
      aiInvestigateErrorRatioThreshold: preset.aiInvestigateErrorRatioThreshold,
      aiInvestigateMinRecentErrors: preset.aiInvestigateMinRecentErrors,
      allowForceAdaptiveReview: preset.allowForceAdaptiveReview,
      allowForceSyncState: preset.allowForceSyncState,
    };
  }

  setRuntimeEnvironment(environment: SamiamRuntimeEnvironment, enforcePolicy?: boolean) {
    this.config.runtimeEnvironment = environment;
    if (typeof enforcePolicy === 'boolean') this.config.enforceEnvironmentAiPolicy = enforcePolicy;
    if (this.config.enforceEnvironmentAiPolicy) this.applyEnvironmentAiPolicy(environment);
  }

  getRuntimeEnvironment(): SamiamRuntimeEnvironment {
    return this.config.runtimeEnvironment;
  }

  setEnvironmentAiPolicyEnforcement(enabled: boolean) {
    this.config.enforceEnvironmentAiPolicy = enabled;
    if (enabled) this.applyEnvironmentAiPolicy(this.config.runtimeEnvironment);
  }

  getEnvironmentAiPolicyEnforcement(): boolean {
    return this.config.enforceEnvironmentAiPolicy;
  }

  applyLoggingPolicy(policy: SamiamWorkloadType | SamiamLoggingPolicy) {
    const resolved = typeof policy === 'string' ? Samiam.getLoggingPolicy(policy) : policy;
    this.setOperatingProfile(resolved.operatingProfile);
    this.config.minLevel = resolved.minLevel;
    this.config.notifyOnLevels = this.mergeUniqueLevels([], resolved.notifyOnLevels);
    this.config.adaptiveReviewLogThreshold = Math.max(1, Math.floor(resolved.adaptiveReviewLogThreshold));
    this.config.rateLimitMs = this.normalizeRateLimitMs(resolved.rateLimitMs);
  }

  captureTriageSnapshot(options: SamiamTriageSnapshotOptions = {}): SamiamTriageSnapshot {
    const recentLogCount = Number.isFinite(options.recentLogCount)
      ? Math.max(0, Math.floor(options.recentLogCount as number))
      : 50;
    const recentErrorCount = Number.isFinite(options.recentErrorCount)
      ? Math.max(0, Math.floor(options.recentErrorCount as number))
      : 20;

    const channels = options.channels?.length
      ? options.channels.map((prefix) => this.getChannelStats(prefix))
      : undefined;

    return {
      timestamp: new Date().toISOString(),
      label: options.label?.trim() || 'triage-snapshot',
      health: this.getHealth(),
      stats: this.getStats(),
      recentLogs: this.getRecentLogs(recentLogCount),
      recentErrors: this.getRecentLogs(recentErrorCount, 'error'),
      channels,
      notes: options.notes,
    };
  }

  getQualityMetrics(options: SamiamQualityMetricsOptions = {}): SamiamQualityMetrics {
    const recentLogCount = Number.isFinite(options.recentLogCount)
      ? Math.max(1, Math.floor(options.recentLogCount as number))
      : 200;

    const actionableLevels = (options.actionableLevels?.length
      ? options.actionableLevels
      : this.config.notifyOnLevels
    ).filter((level) => this.isValidLevel(level));

    const noiseLevels = (options.noiseLevels?.length
      ? options.noiseLevels
      : ['debug', 'info']
    ).filter((level) => this.isValidLevel(level));

    const recentLogs = this.getRecentLogs(recentLogCount);
    const actionableSet = new Set<LogLevel>(actionableLevels);
    const noiseSet = new Set<LogLevel>(noiseLevels);

    let actionableCount = 0;
    let noiseCount = 0;
    let errorCount = 0;
    let warnCount = 0;

    for (const entry of recentLogs) {
      if (actionableSet.has(entry.level)) actionableCount++;
      if (noiseSet.has(entry.level)) noiseCount++;
      if (entry.level === 'error' || entry.level === 'fatal') errorCount++;
      if (entry.level === 'warn') warnCount++;
    }

    const totalConsidered = recentLogs.length;
    const safeTotal = Math.max(1, totalConsidered);

    return {
      totalConsidered,
      actionableCount,
      noiseCount,
      errorCount,
      warnCount,
      noiseRatio: noiseCount / safeTotal,
      actionableAlertPrecision: actionableCount / safeTotal,
    };
  }

  recordQualitySnapshot(label = 'qol-snapshot', options: SamiamQualityMetricsOptions = {}): SamiamQualitySnapshot {
    const metrics = this.getQualityMetrics(options);
    const previous = this.qualitySnapshots.length
      ? this.qualitySnapshots[this.qualitySnapshots.length - 1]
      : undefined;

    const snapshot: SamiamQualitySnapshot = {
      timestamp: new Date().toISOString(),
      label: label.trim() || 'qol-snapshot',
      metrics,
      health: this.getHealth(),
      stats: this.getStats(),
      delta: previous
        ? {
            noiseRatio: metrics.noiseRatio - previous.metrics.noiseRatio,
            actionableAlertPrecision: metrics.actionableAlertPrecision - previous.metrics.actionableAlertPrecision,
          }
        : undefined,
    };

    this.qualitySnapshots.push(snapshot);
    const cap = Math.max(1, this.config.maxQualitySnapshots);
    if (this.qualitySnapshots.length > cap) {
      this.qualitySnapshots.splice(0, this.qualitySnapshots.length - cap);
    }

    return snapshot;
  }

  getQualityHistory(limit = 20): SamiamQualitySnapshot[] {
    const normalizedLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
    if (normalizedLimit <= 0) return [];
    return this.qualitySnapshots.slice(-normalizedLimit);
  }

  assessAiEngagement(stage: AiEngagementStage, options: { reason?: string; entry?: LogEntry; force?: boolean } = {}): AiEngagementDecision {
    return this.shouldRunAiForStage(stage, options);
  }

  evaluateQualityGuard(options: {
    policy?: SamiamWorkloadType | SamiamQualityGuardPolicy;
    baseline?: SamiamQualitySnapshot;
    current?: SamiamQualitySnapshot;
  } = {}): SamiamQualityGuardResult {
    const resolvedPolicy = (() => {
      if (!options.policy) return Samiam.getQualityGuardPolicy('api');
      if (typeof options.policy === 'string') return Samiam.getQualityGuardPolicy(options.policy);
      return {
        workload: options.policy.workload ?? 'custom',
        maxNoiseRatio: options.policy.maxNoiseRatio,
        minActionableAlertPrecision: options.policy.minActionableAlertPrecision,
        maxNoiseRatioIncrease: options.policy.maxNoiseRatioIncrease,
        maxActionablePrecisionDrop: options.policy.maxActionablePrecisionDrop,
        minSamples: options.policy.minSamples,
      };
    })();

    const current = options.current ?? this.qualitySnapshots[this.qualitySnapshots.length - 1];
    const baseline = options.baseline ?? (this.qualitySnapshots.length > 1
      ? this.qualitySnapshots[this.qualitySnapshots.length - 2]
      : undefined);

    const violations: string[] = [];
    let ready = true;

    if (!current) {
      ready = false;
      violations.push('No quality snapshot available. Record at least one snapshot before guard evaluation.');
    }

    if (current && current.metrics.totalConsidered < resolvedPolicy.minSamples) {
      ready = false;
      violations.push(`Insufficient sample size: ${current.metrics.totalConsidered} < ${resolvedPolicy.minSamples}.`);
    }

    if (current) {
      if (current.metrics.noiseRatio > resolvedPolicy.maxNoiseRatio) {
        violations.push(
          `Noise ratio ${current.metrics.noiseRatio.toFixed(3)} exceeds max ${resolvedPolicy.maxNoiseRatio.toFixed(3)}.`
        );
      }
      if (current.metrics.actionableAlertPrecision < resolvedPolicy.minActionableAlertPrecision) {
        violations.push(
          `Actionable precision ${current.metrics.actionableAlertPrecision.toFixed(3)} is below min ${resolvedPolicy.minActionableAlertPrecision.toFixed(3)}.`
        );
      }
    }

    if (current && baseline) {
      const noiseIncrease = current.metrics.noiseRatio - baseline.metrics.noiseRatio;
      const precisionDrop = baseline.metrics.actionableAlertPrecision - current.metrics.actionableAlertPrecision;

      if (noiseIncrease > resolvedPolicy.maxNoiseRatioIncrease) {
        violations.push(
          `Noise ratio increased by ${noiseIncrease.toFixed(3)} (limit ${resolvedPolicy.maxNoiseRatioIncrease.toFixed(3)}).`
        );
      }
      if (precisionDrop > resolvedPolicy.maxActionablePrecisionDrop) {
        violations.push(
          `Actionable precision dropped by ${precisionDrop.toFixed(3)} (limit ${resolvedPolicy.maxActionablePrecisionDrop.toFixed(3)}).`
        );
      }
    }

    const passed = ready && violations.length === 0;
    return {
      ready,
      passed,
      evaluatedAt: new Date().toISOString(),
      policy: resolvedPolicy,
      baseline,
      current,
      violations,
      summary: passed
        ? 'Quality guard passed.'
        : ready
          ? 'Quality guard failed.'
          : 'Quality guard not ready.',
    };
  }

  getAutonomousRecommendations(options: SamiamTriageSnapshotOptions = {}): SamiamTriageRecommendation[] {
    const snapshot = this.captureTriageSnapshot(options);
    const recommendations: SamiamTriageRecommendation[] = [];

    const recentErrorRatio = snapshot.recentLogs.length
      ? snapshot.recentErrors.length / snapshot.recentLogs.length
      : 0;

    if (snapshot.health.bufferUtilization >= 0.85) {
      recommendations.push({
        id: 'buffer-near-capacity',
        title: 'Buffer Near Capacity',
        why: 'Recent log context is close to maxContextEntries, increasing evidence churn risk.',
        action: 'Increase maxContextEntries or reduce low-value logging in the noisiest channel.',
        priority: 'high',
        metric: `bufferUtilization=${snapshot.health.bufferUtilization.toFixed(2)}`,
      });
    }

    if (snapshot.health.aiCircuitOpen || snapshot.stats.aiCircuitOpenSkips > 0) {
      recommendations.push({
        id: 'ai-circuit-open',
        title: 'AI Circuit Open',
        why: 'AI advisory calls are being skipped due to recent provider instability.',
        action: 'Continue with autonomy-first triage and validate provider health before re-enabling aggressive adaptation.',
        priority: 'medium',
        metric: `aiCircuitOpenSkips=${snapshot.stats.aiCircuitOpenSkips}`,
      });
    }

    if (snapshot.stats.grokCalls > 0 && snapshot.stats.grokErrors > 0) {
      const errorRatio = snapshot.stats.grokErrors / snapshot.stats.grokCalls;
      if (errorRatio >= 0.3) {
        recommendations.push({
          id: 'high-ai-error-ratio',
          title: 'High AI Error Ratio',
          why: 'A large share of AI calls are failing, which can waste retry budget during incidents.',
          action: 'Increase aiRequestTimeoutMs and lower aiMaxRetries for production until provider stability improves.',
          priority: 'medium',
          metric: `aiErrorRatio=${errorRatio.toFixed(2)}`,
        });
      }
    }

    if (recentErrorRatio >= 0.4) {
      recommendations.push({
        id: 'high-recent-error-ratio',
        title: 'High Recent Error Ratio',
        why: 'A high proportion of recent logs are error-level events, indicating active degradation.',
        action: 'Create a focused channel snapshot and instrument span boundaries around the failing path.',
        priority: 'high',
        metric: `recentErrorRatio=${recentErrorRatio.toFixed(2)}`,
      });
    }

    if (this.config.minLevel === 'debug' && this.config.notifyOnLevels.includes('warn')) {
      recommendations.push({
        id: 'potential-alert-noise',
        title: 'Potential Alert Noise',
        why: 'Debug-level collection with warn notifications can produce non-actionable alert volume.',
        action: 'Raise minLevel to info or remove warn from notifyOnLevels for production-like profiles.',
        priority: 'low',
        metric: `minLevel=${this.config.minLevel}, notifyOnLevels=${this.config.notifyOnLevels.join(',')}`,
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        id: 'runtime-stable',
        title: 'Runtime Appears Stable',
        why: 'No critical autonomous tuning risks detected in recent telemetry.',
        action: 'Keep current profile and re-check after the next meaningful traffic window.',
        priority: 'low',
      });
    }

    return recommendations;
  }

  createIncidentRunbook(options: SamiamIncidentRunbookOptions = {}): SamiamIncidentRunbook {
    const baseline = this.captureTriageSnapshot(options);
    return {
      generatedAt: new Date().toISOString(),
      label: baseline.label,
      baseline,
      hypothesis: options.hypothesis?.trim() || 'Suspected root cause pending channel and span evidence.',
      changePlan: options.changePlan?.trim() || 'Apply a minimal, reversible change to the most likely failing path.',
      resultPlan: options.resultPlan?.trim() || 'Compare post-change stats/health to baseline and retain only measurable improvements.',
      checklist: [
        'Capture baseline health and stats snapshots.',
        'Isolate noisy channels and inspect recent error slice.',
        'Instrument or validate span boundaries on the critical path.',
        'Apply one reversible change and document intent.',
        'Compare before/after telemetry and decide keep/revert.',
      ],
      recommendations: this.getAutonomousRecommendations(options),
    };
  }

  getTroubleshootingChecklist(topic: SamiamTroubleshootingTopic = 'general'): string[] {
    switch (topic) {
      case 'ai-failures':
        return [
          'Check aiCircuitOpen and aiCircuitOpenSkips in getHealth/getStats.',
          'Validate aiRequestTimeoutMs against upstream response latency.',
          'Reduce aiMaxRetries during incident pressure to protect runtime budget.',
          'Continue triage with getRecentLogs and captureTriageSnapshot while AI recovers.',
        ];
      case 'noise':
        return [
          'Review workload policy and verify minLevel matches environment intent.',
          'Remove warn from notifyOnLevels if alerts are non-actionable.',
          'Use namespace or child loggers to isolate noisy modules.',
          'Confirm sanitizeKeys cover high-volume sensitive payload fields.',
        ];
      case 'triage':
        return [
          'Capture baseline using createIncidentRunbook or captureTriageSnapshot.',
          'Correlate failures with createCorrelationId and startSpan/endSpan.',
          'Compare recentErrors before and after each reversible change.',
          'Keep only changes that improve signal quality or error ratio.',
        ];
      case 'sync':
        return [
          'Inspect syncActionApplied and adaptationApplied events.',
          'Use strictSyncMode in production-sensitive environments.',
          'Validate custom sync handlers for idempotency and failure isolation.',
          'Run syncState only when baseline telemetry is captured and stable.',
        ];
      case 'general':
      default:
        return [
          'Start with getHealth, getStats, and getRecentLogs for baseline visibility.',
          'Use namespace/channel stats to identify highest-noise modules.',
          'Apply one bounded change at a time and measure impact.',
          'Preserve autonomy-first operation when AI is degraded.',
        ];
    }
  }

  getChannelStats(prefix: string) {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };

    const isMatch = (message: string) => {
      if (!message.startsWith(`[${prefix}`)) return false;
      const marker = message.charAt(prefix.length + 1);
      return marker === ']' || marker === '.';
    };

    let totalLogs = 0;
    for (const entry of this.logs) {
      if (!isMatch(entry.message)) continue;
      totalLogs += 1;
      byLevel[entry.level] += 1;
    }

    return {
      prefix,
      totalLogs,
      byLevel,
    };
  }

  createCorrelationId(...parts: Array<string | number | null | undefined>): string {
    const normalized = parts
      .filter((part): part is string | number => part !== undefined && part !== null)
      .map((part) => String(part).trim().replace(/\s+/g, '-'))
      .filter(Boolean)
      .join(':');

    const suffix = randomUUID().slice(0, 8);
    return normalized ? `${normalized}:${suffix}` : suffix;
  }

  namespace(prefix: string): SamiamNamespaceLogger {
    const base = this;
    const withPrefix = (message: string) => `[${prefix}] ${message}`;

    return {
      debug: (message, meta, correlationId) => base.debug(withPrefix(message), meta, correlationId),
      info: (message, meta, correlationId) => base.info(withPrefix(message), meta, correlationId),
      warn: (message, meta, correlationId) => base.warn(withPrefix(message), meta, correlationId),
      error: (message, meta, correlationId) => base.error(withPrefix(message), meta, correlationId),
      fatal: (message, meta, correlationId) => base.fatal(withPrefix(message), meta, correlationId),
      child: (nestedPrefix: string) => base.namespace(`${prefix}.${nestedPrefix}`),
      getStats: () => base.getStats(),
      getChannelStats: () => base.getChannelStats(prefix),
      getHealth: () => base.getHealth(),
      close: async () => {},
    };
  }

  child(prefix: string, extraConfig: Partial<SamiamConfig> = {}): Samiam {
    const child = new Samiam({ ...this.config, ...extraConfig });

    // Reuse parent transport so child and parent share output behavior.
    child.transport = this.transport;

    // Ensure child entries consistently carry the namespace prefix.
    const originalLog = child.log.bind(child);
    child.log = (level, message, meta = {}, correlationId) => {
      const prefixedMessage = `[${prefix}] ${message}`;
      return originalLog(level, prefixedMessage, meta, correlationId);
    };

    return child;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.config.minLevel];
  }

  private sanitize(meta: any, seen = new WeakSet()): any {
    if (typeof meta !== 'object' || meta === null) return meta;
    if (seen.has(meta)) return '[Circular]';
    seen.add(meta);
    const out: any = Array.isArray(meta) ? [] : {};
    for (const [k, v] of Object.entries(meta)) {
      if (this.isSensitiveKey(k)) out[k] = '[REDACTED]';
      else { try { out[k] = this.sanitize(v, seen); } catch { out[k] = '[Unserializable]'; } }
    }
    return out;
  }

  log(level: LogLevel, message: string, meta: Record<string, any> = {}, correlationId?: string): LogEntry | null {
    if (!this.shouldLog(level)) return null;

    const cid = correlationId || randomUUID();
    const entry: LogEntry = {
      id: randomUUID(),
      correlationId: cid,
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: this.sanitize(meta),
      stack: this.config.captureErrorStack && ['error', 'fatal'].includes(level) ? new Error().stack : undefined,
    };

    this.logs.push(entry);
    if (this.logs.length > this.config.maxContextEntries) this.logs.shift();

    this.statsData.totalLogs++;
    this.logCountSinceReview++;
    this.transport(entry);

    if (this.config.notifyOnLevels.includes(level)) this.enqueueGrok(entry);

    if (this.config.enableAdaptiveMode && this.logCountSinceReview >= this.config.adaptiveReviewLogThreshold) {
      this.triggerAdaptiveReview('log-threshold');
    }
    return entry;
  }

  debug(m: string, meta?: any, cid?: string) { return this.log('debug', m, meta, cid); }
  info(m: string, meta?: any, cid?: string)  { return this.log('info', m, meta, cid); }
  warn(m: string, meta?: any, cid?: string)  { return this.log('warn', m, meta, cid); }
  error(m: string, meta?: any, cid?: string) { return this.log('error', m, meta, cid); }
  fatal(m: string, meta?: any, cid?: string) { return this.log('fatal', m, meta, cid); }

  startSpan(name: string, correlationId?: string): string {
    const cid = correlationId || randomUUID();
    this.activeSpans.set(cid, Date.now());
    this.debug(`Span started: ${name}`, { span: name }, cid);
    return cid;
  }

  endSpan(correlationId: string, meta: Record<string, any> = {}) {
    const start = this.activeSpans.get(correlationId);
    if (start) {
      const duration = Date.now() - start;
      this.info(`Span ended`, { ...meta, durationMs: duration }, correlationId);
      this.activeSpans.delete(correlationId);
    }
  }

  timer(name: string, correlationId?: string) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`Timer: ${name}`, { durationMs: duration }, correlationId);
      return duration;
    };
  }

  wrap<T extends (...args: any[]) => any>(fn: T, name = fn.name || 'anonymous'): T {
    return ((...args: any[]) => {
      const cid = randomUUID();
      try {
        const result = fn(...args);
        return result instanceof Promise
          ? result.catch((err: any) => {
              this.error(`Error in ${name}`, { args: this.sanitize(args), error: this.toErrorMessage(err) }, cid);
              throw err;
            })
          : result;
      } catch (err: any) {
        this.error(`Error in ${name}`, { args: this.sanitize(args), error: this.toErrorMessage(err) }, cid);
        throw err;
      }
    }) as T;
  }

  getStats(): SamiamStats {
    return { ...this.statsData, bufferSize: this.logs.length, learnedLessons: this.learnedKnowledge.lessons.length };
  }

  getHealth(): SamiamHealth {
    const aiCircuitOpen = this.isAiCircuitOpen();
    const maxEntries = Math.max(1, this.config.maxContextEntries);
    return {
      operatingProfile: this.config.operatingProfile,
      isClosed: this.isClosed,
      pendingAiTasks: this.pendingAiTasks,
      aiCircuitOpen,
      aiCircuitOpenUntil: aiCircuitOpen ? this.aiCircuitOpenUntil : 0,
      aiConsecutiveFailures: this.aiConsecutiveFailures,
      bufferUtilization: this.logs.length / maxEntries,
    };
  }

  getRecentLogs(count = 50, level?: LogLevel) {
    const normalizedCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    if (!level) return normalizedCount > 0 ? this.logs.slice(-normalizedCount) : [];
    if (normalizedCount <= 0) return [];
    const out: LogEntry[] = [];
    for (let i = this.logs.length - 1; i >= 0 && out.length < normalizedCount; i--) {
      const entry = this.logs[i];
      if (entry.level === level) out.push(entry);
    }
    return out.reverse();
  }

  getInsight(correlationId: string): GrokInsight | undefined { return this.grokInsights.get(correlationId); }
  getLearnedKnowledge(): LearnedKnowledge {
    return {
      ...this.learnedKnowledge,
      lessons: [...this.learnedKnowledge.lessons],
    };
  }
  getSyncState() {
    return {
      config: {
        ...this.config,
        rateLimitMs: this.normalizeRateLimitMs(this.config.rateLimitMs),
        notifyOnLevels: [...this.config.notifyOnLevels],
        sanitizeKeys: [...this.config.sanitizeKeys],
      },
      stats: this.getStats(),
      learned: {
        ...this.learnedKnowledge,
        lessons: [...this.learnedKnowledge.lessons],
      },
    };
  }

  // === Synchronized Adaptive Layer ===
  startAdaptiveReview() {
    if (this.adaptiveTimer) clearInterval(this.adaptiveTimer);
    this.adaptiveTimer = setInterval(() => this.triggerAdaptiveReview('timed'), this.config.adaptiveReviewIntervalMs);
  }

  stopAdaptiveReview() {
    if (this.adaptiveTimer) { clearInterval(this.adaptiveTimer); this.adaptiveTimer = null; }
  }

  async forceAdaptiveReview(reason = 'manual') { await this.triggerAdaptiveReview(reason, true); }

  async syncState(reason = 'manual') {
    if (this.config.enforceEnvironmentAiPolicy) {
      const policy = Samiam.getEnvironmentAiPolicy(this.config.runtimeEnvironment);
      if (!policy.allowForceSyncState) {
        this.statsData.aiPolicySkips++;
        this.emitEvent('aiEngagementEvaluated', {
          stage: 'audit',
          engage: false,
          intents: ['audit'],
          reason: `Force sync is disabled in ${policy.environment}`,
          triggerReason: reason,
          force: true,
        });
        return;
      }
    }

    const engagement = this.evaluateAndEmitAiEngagement('audit', { reason, force: true });
    if (!engagement.engage) return;
    const state = this.getSyncState();
    const prompt = `Synchronize with current debugger/logger state (0↔∞ mindset). Return JSON with adaptations and syncActions.
State: ${JSON.stringify(state)}`;
    // reuse the same Grok call path
    await this.callGrokForSync(prompt, 'sync-state');
  }

  private async triggerAdaptiveReview(reason: string, force = false) {
    this.logCountSinceReview = 0;
    if (!this.config.grokApiKey || !this.config.enableAdaptiveMode) return;

    if (force && this.config.enforceEnvironmentAiPolicy) {
      const policy = Samiam.getEnvironmentAiPolicy(this.config.runtimeEnvironment);
      if (!policy.allowForceAdaptiveReview) {
        this.statsData.aiPolicySkips++;
        this.emitEvent('aiEngagementEvaluated', {
          stage: 'revise',
          engage: false,
          intents: ['revise'],
          reason: `Force adaptive review is disabled in ${policy.environment}`,
          triggerReason: reason,
          force,
        });
        return;
      }
    }

    const engagement = this.evaluateAndEmitAiEngagement('revise', { reason, force });
    if (!engagement.engage) return;

    const summary = {
      totalLogs: this.statsData.totalLogs,
      recentErrors: this.logs.filter(l => ['error','fatal'].includes(l.level)).slice(-10),
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

  private async callGrokForSync(prompt: string, reason: string) {
    try {
      const content = await this.requestAiWithRetry(prompt);
      const parsed = this.parseGrokPayload(content);

      if (!parsed) {
        console.warn('[Samiam] Sync response had no parseable JSON payload');
        return;
      }

      const normalizedAdaptation = this.normalizeAdaptation(parsed.adaptations);
      const normalizedLessons = this.normalizeLearnedLessons(parsed.learnedLessons);
      const normalizedActions = this.normalizeSyncActions(parsed.syncActions);

      const adaptationApplied = normalizedAdaptation ? this.applyAdaptations(normalizedAdaptation, reason) : false;
      const lessonsAdded = normalizedLessons.length ? this.appendLearnedLessons(normalizedLessons) : 0;
      const appliedSyncCount = normalizedActions.length
        ? await this.applySyncActions(normalizedActions, reason)
        : 0;

      if (adaptationApplied || lessonsAdded > 0 || appliedSyncCount > 0) {
        this.learnedKnowledge.lastAdaptedAt = new Date().toISOString();
        this.learnedKnowledge.adaptationCount++;
      }
      console.info('[Samiam] Sync/Adaptive review completed', { reason, actionsApplied: appliedSyncCount });

    } catch (err: any) {
      const errorMessage = this.toErrorMessage(err);
      this.emitEvent('aiCallFailed', { stage: 'sync', reason, error: errorMessage });
      console.error('[Samiam] Sync call failed:', errorMessage);
    }
  }

  private applyAdaptations(adapt: Adaptation, reason: string): boolean {
    let applied = false;
    if (adapt.minLevel && LEVEL_ORDER[adapt.minLevel] >= LEVEL_ORDER[this.config.minLevel]) {
      this.config.minLevel = adapt.minLevel; applied = true;
    }
    if (adapt.notifyOnLevels?.length) {
      const merged = this.mergeUniqueLevels(this.config.notifyOnLevels, adapt.notifyOnLevels);
      if (merged.length !== this.config.notifyOnLevels.length) {
        this.config.notifyOnLevels = merged;
        applied = true;
      }
    }
    if (adapt.sanitizeKeys?.length) {
      const merged = this.mergeUniqueSanitizeKeys(this.config.sanitizeKeys, adapt.sanitizeKeys);
      if (merged.length !== this.config.sanitizeKeys.length) {
        this.config.sanitizeKeys = merged;
        this.rebuildSanitizeKeySet();
        applied = true;
      }
    }
    if (typeof adapt.rateLimitMs === 'number' && Number.isFinite(adapt.rateLimitMs) && adapt.rateLimitMs > 0) {
      const nextRateLimit = this.normalizeRateLimitMs(adapt.rateLimitMs);
      if (this.config.rateLimitMs !== nextRateLimit) {
        this.config.rateLimitMs = nextRateLimit;
        applied = true;
      }
    }

    if (applied) {
      this.statsData.adaptationsApplied++;
      this.log('info', 'Live adaptation applied', { reason, adaptations: adapt }, 'system-sync');
      this.emitEvent('adaptationApplied', { reason, adaptations: adapt });
    }
    return applied;
  }

  private async applySyncActions(actions: SyncAction[], reason: string): Promise<number> {
    let appliedCount = 0;
    for (const action of actions) {
      try {
        let applied = false;
        switch (action.type) {
          case 'changeMinLevel':
            if (this.isValidLevel(action.payload)) {
              this.config.minLevel = action.payload as LogLevel;
              applied = true;
            }
            break;
          // ... all other cases unchanged
          case 'addNotifyLevel':
            if (this.isValidLevel(action.payload) && !this.config.notifyOnLevels.includes(action.payload)) {
              this.config.notifyOnLevels.push(action.payload);
              applied = true;
            }
            break;
          case 'updateRateLimit':
            if (typeof action.payload === 'number' && Number.isFinite(action.payload) && action.payload >= 100) {
              this.config.rateLimitMs = this.normalizeRateLimitMs(action.payload);
              applied = true;
            }
            break;
          case 'addSanitizeKey':
            if (typeof action.payload === 'string') {
              const key = action.payload.trim();
              if (key) {
                const next = this.mergeUniqueSanitizeKeys(this.config.sanitizeKeys, [key]);
                if (next.length !== this.config.sanitizeKeys.length) {
                  this.config.sanitizeKeys = next;
                  this.rebuildSanitizeKeySet();
                  applied = true;
                }
              }
            }
            break;
          case 'logPattern':
            this.info('Grok-detected pattern', { pattern: action.payload, reason: action.reason }, 'system-sync');
            applied = true;
            break;
          case 'custom':
            if (this.config.strictSyncMode && !this.config.allowCustomSyncActions) break;
            for (const h of this.syncHandlers) await h(action);
            applied = true;
            break;
        }
        if (applied) {
          appliedCount++;
          this.statsData.syncActionsApplied++;
          this.log('info', `Sync action applied: ${action.type}`, { action, reason }, 'system-sync');
          this.emitEvent('syncActionApplied', { reason, actionType: action.type });
        }
      } catch (e: any) {
        this.error('Sync action failed', { action, error: this.toErrorMessage(e) }, 'system-sync');
      }
    }
    return appliedCount;
  }

  async close() {
    this.isClosed = true;
    this.stopAdaptiveReview();
    if (this.config.enableAdaptiveMode && this.config.grokApiKey) {
      await this.triggerAdaptiveReview('shutdown');
    }
    await this.grokQueue.catch(() => {});
    this.logs.length = 0;
    this.activeSpans.clear();
    this.grokInsights.clear();
    this.grokQueue = Promise.resolve(); // clear pending queue
  }

  private enqueueGrok(entry: LogEntry) {
    if (this.isClosed) return;
    this.pendingAiTasks++;
    this.grokQueue = this.grokQueue
      .then(() => this.notifyGrok(entry))
      .catch(() => {})
      .finally(() => {
        this.pendingAiTasks = Math.max(0, this.pendingAiTasks - 1);
      });
  }

  private async notifyGrok(entry: LogEntry) {
    if (this.isClosed || !this.config.grokApiKey) return;

    const engagement = this.evaluateAndEmitAiEngagement('investigate', { entry });
    if (!engagement.engage) return;

    const now = Date.now();
    if (now - this.lastGrokCall < this.config.rateLimitMs) {
      this.statsData.grokSkipped++;
      return;
    }
    this.lastGrokCall = now;
    this.statsData.grokCalls++;
    this.statsData.lastGrokAt = now;

    const context = this.logs.slice(-this.config.maxPromptContextEntries);
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
      const content = await this.requestAiWithRetry(prompt);

      let insight: GrokInsight = { raw: content };
      const parsed = this.parseGrokPayload(content);
      if (parsed) {
        const normalizedAdaptation = this.normalizeAdaptation(parsed.adaptations);
        const normalizedActions = this.normalizeSyncActions(parsed.syncActions);
        const rootCause = typeof parsed.rootCause === 'string' ? parsed.rootCause : undefined;
        const nextPrompt = typeof parsed.nextPrompt === 'string' ? parsed.nextPrompt : undefined;
        const fixes = Array.isArray(parsed.fixes)
          ? parsed.fixes.filter((item): item is string => typeof item === 'string' && !!item.trim())
          : undefined;
        insight = { rootCause, nextPrompt, fixes, raw: content };
        if (normalizedAdaptation) this.applyAdaptations(normalizedAdaptation, 'grok-insight');
        if (normalizedActions.length) await this.applySyncActions(normalizedActions, 'grok-insight');
      }

      this.setInsight(entry.correlationId, insight);
      console.info('[Samiam] Grok insight stored', { id: entry.id, correlationId: entry.correlationId });

    } catch (err: any) {
      this.statsData.grokErrors++;
      const errorMessage = this.toErrorMessage(err);
      this.emitEvent('aiCallFailed', { stage: 'notify', error: errorMessage });
      if (!this.isClosed) {
        console.error('[Samiam] Grok call failed:', errorMessage);      
      }
    }
  }

  private appendLearnedLessons(lessons: string[]): number {
    const before = this.learnedKnowledge.lessons.length;
    const merged = [...new Set([...this.learnedKnowledge.lessons, ...lessons])];
    const cap = Math.max(1, this.config.maxLearnedLessons);
    this.learnedKnowledge.lessons = merged.slice(-cap);
    return this.learnedKnowledge.lessons.length - before;
  }

  private setInsight(correlationId: string, insight: GrokInsight) {
    if (this.grokInsights.has(correlationId)) this.grokInsights.delete(correlationId);
    this.grokInsights.set(correlationId, insight);
    const cap = Math.max(1, this.config.maxInsightEntries);
    while (this.grokInsights.size > cap) {
      const oldest = this.grokInsights.keys().next().value;
      if (!oldest) break;
      this.grokInsights.delete(oldest);
    }
  }
}
export default Samiam;
