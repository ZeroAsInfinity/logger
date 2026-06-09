export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
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
export declare class Samiam {
    private config;
    private logs;
    private lastGrokCall;
    private activeSpans;
    private grokInsights;
    private transport;
    private syncHandlers;
    private statsData;
    private grokQueue;
    private learnedKnowledge;
    private adaptiveTimer;
    private logCountSinceReview;
    private isClosed;
    constructor(config?: SamiamConfig);
    setTransport(fn: LogTransport): void;
    registerSyncHandler(handler: SyncHandler): void;
    child(prefix: string, extraConfig?: Partial<SamiamConfig>): Samiam;
    private shouldLog;
    private sanitize;
    log(level: LogLevel, message: string, meta?: Record<string, any>, correlationId?: string): LogEntry | null;
    debug(m: string, meta?: any, cid?: string): LogEntry | null;
    info(m: string, meta?: any, cid?: string): LogEntry | null;
    warn(m: string, meta?: any, cid?: string): LogEntry | null;
    error(m: string, meta?: any, cid?: string): LogEntry | null;
    fatal(m: string, meta?: any, cid?: string): LogEntry | null;
    startSpan(name: string, correlationId?: string): string;
    endSpan(correlationId: string, meta?: Record<string, any>): void;
    timer(name: string, correlationId?: string): () => number;
    wrap<T extends (...args: any[]) => any>(fn: T, name?: string): T;
    getStats(): {
        bufferSize: number;
        learnedLessons: number;
        totalLogs: number;
        grokCalls: number;
        grokErrors: number;
        grokSkipped: number;
        adaptationsApplied: number;
        lastGrokAt: number;
        syncActionsApplied: number;
    };
    getRecentLogs(count?: number, level?: LogLevel): LogEntry[];
    getInsight(correlationId: string): GrokInsight | undefined;
    getLearnedKnowledge(): LearnedKnowledge;
    getSyncState(): {
        config: Required<SamiamConfig>;
        stats: {
            bufferSize: number;
            learnedLessons: number;
            totalLogs: number;
            grokCalls: number;
            grokErrors: number;
            grokSkipped: number;
            adaptationsApplied: number;
            lastGrokAt: number;
            syncActionsApplied: number;
        };
        learned: LearnedKnowledge;
    };
    startAdaptiveReview(): void;
    stopAdaptiveReview(): void;
    forceAdaptiveReview(reason?: string): Promise<void>;
    syncState(reason?: string): Promise<void>;
    private triggerAdaptiveReview;
    private callGrokForSync;
    private applyAdaptations;
    private applySyncActions;
    close(): Promise<void>;
    private enqueueGrok;
    private notifyGrok;
}
export default Samiam;
//# sourceMappingURL=samiam.d.ts.map