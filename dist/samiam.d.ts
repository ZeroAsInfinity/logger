export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type OperatingProfile = 'conservative' | 'balanced' | 'aggressive';
export type SamiamWorkloadType = 'api' | 'worker' | 'batch' | 'realtime';
export type SamiamRuntimeEnvironment = 'dev' | 'staging' | 'prod';
export type AiEngagementMode = 'off' | 'viability-gated' | 'always-on';
export type AiEngagementStage = 'investigate' | 'revise' | 'repair' | 'audit' | 'append';
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
export type SamiamEventName = 'profileChanged' | 'adaptationApplied' | 'syncActionApplied' | 'aiCircuitOpen' | 'aiCallFailed' | 'aiEngagementEvaluated';
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
export type AiRequestOptions = {
    timeoutMs?: number;
};
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
    private sanitizeKeySetLower;
    private aiProvider;
    private aiConsecutiveFailures;
    private aiCircuitOpenUntil;
    private pendingAiTasks;
    private eventHandlers;
    private qualitySnapshots;
    private readonly syncActionTypes;
    private isValidLevel;
    private isSensitiveKey;
    private rebuildSanitizeKeySet;
    private sleep;
    private clamp;
    private toErrorMessage;
    private isAiCircuitOpen;
    private markAiAttemptSuccess;
    private markAiAttemptFailure;
    private emitEvent;
    private applyOperatingProfile;
    private applyEnvironmentAiPolicy;
    private normalizeRateLimitMs;
    private shouldRunAiForStage;
    private evaluateAndEmitAiEngagement;
    private requestAiWithRetry;
    private readonly defaultAiProvider;
    private mergeUniqueLevels;
    private mergeUniqueSanitizeKeys;
    private extractJsonCandidate;
    private parseGrokPayload;
    private normalizeLearnedLessons;
    private normalizeAdaptation;
    private normalizeSyncActions;
    constructor(config?: SamiamConfig);
    setTransport(fn: LogTransport): void;
    setAiProvider(provider: AiProvider): void;
    registerSyncHandler(handler: SyncHandler): void;
    onEvent(name: SamiamEventName, handler: SamiamEventHandler): () => void;
    offEvent(name: SamiamEventName, handler: SamiamEventHandler): void;
    setOperatingProfile(profile: OperatingProfile): void;
    getOperatingProfile(): OperatingProfile;
    static getLoggingPolicy(workload: SamiamWorkloadType): SamiamLoggingPolicy;
    static getQualityGuardPolicy(workload: SamiamWorkloadType): SamiamQualityGuardPolicy;
    static getEnvironmentAiPolicy(environment: SamiamRuntimeEnvironment): SamiamEnvironmentAiPolicy;
    setRuntimeEnvironment(environment: SamiamRuntimeEnvironment, enforcePolicy?: boolean): void;
    getRuntimeEnvironment(): SamiamRuntimeEnvironment;
    setEnvironmentAiPolicyEnforcement(enabled: boolean): void;
    getEnvironmentAiPolicyEnforcement(): boolean;
    applyLoggingPolicy(policy: SamiamWorkloadType | SamiamLoggingPolicy): void;
    captureTriageSnapshot(options?: SamiamTriageSnapshotOptions): SamiamTriageSnapshot;
    getQualityMetrics(options?: SamiamQualityMetricsOptions): SamiamQualityMetrics;
    recordQualitySnapshot(label?: string, options?: SamiamQualityMetricsOptions): SamiamQualitySnapshot;
    getQualityHistory(limit?: number): SamiamQualitySnapshot[];
    assessAiEngagement(stage: AiEngagementStage, options?: {
        reason?: string;
        entry?: LogEntry;
        force?: boolean;
    }): AiEngagementDecision;
    evaluateQualityGuard(options?: {
        policy?: SamiamWorkloadType | SamiamQualityGuardPolicy;
        baseline?: SamiamQualitySnapshot;
        current?: SamiamQualitySnapshot;
    }): SamiamQualityGuardResult;
    getAutonomousRecommendations(options?: SamiamTriageSnapshotOptions): SamiamTriageRecommendation[];
    createIncidentRunbook(options?: SamiamIncidentRunbookOptions): SamiamIncidentRunbook;
    getTroubleshootingChecklist(topic?: SamiamTroubleshootingTopic): string[];
    getChannelStats(prefix: string): {
        prefix: string;
        totalLogs: number;
        byLevel: Record<LogLevel, number>;
    };
    createCorrelationId(...parts: Array<string | number | null | undefined>): string;
    namespace(prefix: string): SamiamNamespaceLogger;
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
    getStats(): SamiamStats;
    getHealth(): SamiamHealth;
    getRecentLogs(count?: number, level?: LogLevel): LogEntry[];
    getInsight(correlationId: string): GrokInsight | undefined;
    getLearnedKnowledge(): LearnedKnowledge;
    getSyncState(): {
        config: {
            rateLimitMs: number;
            notifyOnLevels: LogLevel[];
            sanitizeKeys: string[];
            grokApiKey: string;
            grokEndpoint: string;
            grokModel: string;
            minLevel: LogLevel;
            enableContinuousIteration: boolean;
            maxContextEntries: number;
            enableAdaptiveMode: boolean;
            adaptiveReviewIntervalMs: number;
            adaptiveReviewLogThreshold: number;
            strictSyncMode: boolean;
            allowCustomSyncActions: boolean;
            maxLearnedLessons: number;
            maxInsightEntries: number;
            aiRequestTimeoutMs: number;
            aiMaxRetries: number;
            aiRetryBaseDelayMs: number;
            maxPromptContextEntries: number;
            captureErrorStack: boolean;
            minRateLimitMs: number;
            maxRateLimitMs: number;
            aiCircuitBreakerFailures: number;
            aiCircuitBreakerCooldownMs: number;
            operatingProfile: OperatingProfile;
            maxQualitySnapshots: number;
            aiEngagementMode: AiEngagementMode;
            aiInvestigateErrorRatioThreshold: number;
            aiInvestigateMinRecentErrors: number;
            runtimeEnvironment: SamiamRuntimeEnvironment;
            enforceEnvironmentAiPolicy: boolean;
        };
        stats: SamiamStats;
        learned: {
            lessons: string[];
            lastAdaptedAt: string;
            adaptationCount: number;
        };
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
    private appendLearnedLessons;
    private setInsight;
}
export default Samiam;
//# sourceMappingURL=samiam.d.ts.map