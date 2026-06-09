# samiam-logger

Adaptive TypeScript logger/debugger with optional Grok-powered insight, bounded runtime adaptation, and production-safe control loops.

This project is intentionally iterative: each release is a checkpoint, and each checkpoint should be followed by measured refinement.

Repository: https://github.com/ZeroAsInfinity/logger
Issues: https://github.com/ZeroAsInfinity/logger/issues

This work builds on the original 0<->infinity concept conceived by Sam Pearson:
"nothing has no beginning and no ending, whereas infinity has a beginning and ending of nothing."

## Why samiam-logger

- Strong defaults for operational safety.
- Clear observability surface: stats, health, events, and channel summaries.
- Optional AI-driven adaptation with bounded controls (timeouts, retries, circuit breaker).
- Provider-pluggable AI layer so core logging remains stable even as model providers evolve.

## Core Philosophy

1. Autonomy first: the debugger and logger must remain production-valuable with AI fully disabled.
2. AI second: the AI layer is advisory and enhancement-oriented, never a hard runtime dependency.
3. Safety by default: bounded retries, timeouts, circuit breaker, and strict sync controls protect runtime stability.
4. Operator control: behavior is observable, explainable, and reversible through policy and events.

## Runtime Architecture Posture

The runtime is intentionally split into three layers:

1. Core logger/debugger layer (always-on): levels, correlation IDs, spans, timers, sanitization, channel stats, health, and snapshots.
2. Control layer (guardrails): operating profiles, strict sync mode, rate limits, retry budgets, and event hooks.
3. AI layer (optional): insight generation and adaptation suggestions that are validated before application.

If the AI layer is unavailable, the core and control layers continue to function without degradation of baseline observability.

## Quality of Life Improvements

This project prioritizes day-to-day developer ergonomics, not only feature breadth.

- Fast operational visibility through getStats, getHealth, and channel summaries.
- Safer defaults that reduce configuration burden in early adoption.
- Predictable runtime behavior via rate limits, retries, and circuit-breaker controls.
- Iterative tuning model that encourages small, test-backed updates.
- Release confidence workflow with verify plus pack dry-run checks.

Quality-of-life direction for upcoming iterations:

1. Improve default onboarding examples for common service patterns.
2. Expand troubleshooting guidance for timeout, retry, and circuit-open scenarios.
3. Add concise API lookup patterns for frequently used methods.

## Debugger and Logger QoL Presets

Use these presets as high-leverage starting points, then iterate from telemetry.

### 1) Local Development Preset

Best for fast feedback during feature work.

```ts
const samiam = new Samiam({
  operatingProfile: 'aggressive',
  minLevel: 'debug',
  notifyOnLevels: ['error', 'fatal'],
  enableAdaptiveMode: false,
  captureErrorStack: true,
});
```

### 2) Production API Preset

Best for stable and safe runtime behavior.

```ts
const samiam = new Samiam({
  operatingProfile: 'balanced',
  minLevel: 'info',
  notifyOnLevels: ['error', 'fatal'],
  enableAdaptiveMode: true,
  strictSyncMode: true,
  allowCustomSyncActions: false,
});
```

### 3) High-Noise Worker Preset

Best when event volume is high and noise control is critical.

```ts
const samiam = new Samiam({
  operatingProfile: 'conservative',
  minLevel: 'warn',
  notifyOnLevels: ['fatal'],
  enableAdaptiveMode: true,
  adaptiveReviewLogThreshold: 500,
  rateLimitMs: 3000,
});
```

## Requirements

- Node.js 18+
- TypeScript users are supported out of the box via bundled type definitions.

## Installation

```bash
npm install samiam-logger
```

## Quick Start

```ts
import Samiam from 'samiam-logger';

const samiam = new Samiam({
  minLevel: 'info',
  notifyOnLevels: ['error', 'fatal'],
  grokApiKey: process.env.GROK_API_KEY,
});

samiam.info('service booted', { service: 'api', port: 3000 });
samiam.error('db connection failed', { host: 'db.internal', token: 'secret' });

console.log(samiam.getStats());
console.log(samiam.getHealth());

await samiam.close();
```

## Core Features

- Log levels: debug, info, warn, error, fatal
- Correlation IDs for request/span tracing
- Sensitive metadata sanitization with circular reference handling
- Optional Grok insight calls for root-cause/fix guidance
- Optional adaptive mode for controlled runtime tuning
- Namespace and child logger helpers for multi-module apps
- Event hooks for profile changes, adaptations, sync actions, and AI failures

### Autonomy Guarantees

- Logging pipeline continues without AI key/provider.
- Triage evidence remains available through getRecentLogs, getStats, getHealth, and channel stats.
- Namespace and correlation workflows are deterministic and independent of AI responses.
- Adaptive controls remain bounded even when AI returns malformed or noisy payloads.

### AI Layer Contract

- AI responses are treated as untrusted and normalized before use.
- Only known adaptation fields and known sync action types are accepted.
- Strict mode can block custom sync actions in sensitive environments.
- Circuit breaker protects services during repeated provider failures.

## Configuration

```ts
type SamiamConfig = {
  grokApiKey?: string;
  grokEndpoint?: string; // default: https://api.x.ai/v1/chat/completions
  grokModel?: string; // default: grok-4.3
  notifyOnLevels?: Array<'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
  minLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  rateLimitMs?: number; // default: 1500
  enableContinuousIteration?: boolean; // default: true
  maxContextEntries?: number; // default: 1000
  sanitizeKeys?: string[]; // default includes password/token/secret/apiKey
  enableAdaptiveMode?: boolean; // default: false
  adaptiveReviewIntervalMs?: number; // default: 300000
  adaptiveReviewLogThreshold?: number; // default: 200
  strictSyncMode?: boolean; // default: false
  allowCustomSyncActions?: boolean; // default: true
  maxLearnedLessons?: number; // default: 500
  maxInsightEntries?: number; // default: 1000
  aiRequestTimeoutMs?: number; // default: 12000
  aiMaxRetries?: number; // default: 2
  aiRetryBaseDelayMs?: number; // default: 350
  maxPromptContextEntries?: number; // default: 30
  captureErrorStack?: boolean; // default: true
  minRateLimitMs?: number; // default: 100
  maxRateLimitMs?: number; // default: 60000
  aiCircuitBreakerFailures?: number; // default: 3
  aiCircuitBreakerCooldownMs?: number; // default: 30000
  operatingProfile?: 'conservative' | 'balanced' | 'aggressive'; // default: balanced
  aiEngagementMode?: 'off' | 'viability-gated' | 'always-on'; // default: viability-gated
  aiInvestigateErrorRatioThreshold?: number; // default: 0.25
  aiInvestigateMinRecentErrors?: number; // default: 2
  runtimeEnvironment?: 'dev' | 'staging' | 'prod'; // default: staging
  enforceEnvironmentAiPolicy?: boolean; // default: false
};
```

AI engagement defaults are autonomy-first: core logging/debugging always runs, and AI engages only when viability conditions are met unless explicitly set to `always-on`.

## Practical Usage

### Debugger and Logger Improvements

The logger is designed to improve both diagnostics quality and debugging flow over time.

- Better signal quality: stronger noise filtering through level control and notifyOnLevels.
- Better traceability: correlation helpers, spans, timers, and namespace segmentation.
- Better runtime feedback: event hooks for adaptation, sync actions, and AI failures.
- Better safety posture: bounded adaptive behavior with explicit operating profiles.

Recommended improvement loop for debugger/logger quality:

1. Baseline: capture current stats and health snapshots from representative traffic.
2. Target: choose one measurable improvement goal (for example, lower error triage time).
3. Apply: tune profile, thresholds, or sanitization keys in a minimal change set.
4. Validate: run verify, compare telemetry and event outcomes, keep only clear wins.

### Design and Development Toolkit

Use the built-in policy and snapshot helpers to turn debugger/logger guidance into repeatable code.

```ts
import Samiam from 'samiam-logger';

const samiam = new Samiam({ grokApiKey: process.env.GROK_API_KEY });

// Start from a known workload policy design.
samiam.applyLoggingPolicy('api');

// Capture a structured baseline for runbook-driven triage.
const baseline = samiam.captureTriageSnapshot({
  label: 'incident-782-baseline',
  channels: ['api', 'api.db'],
  notes: {
    hypothesis: 'database connection churn',
  },
});

console.log(baseline.health, baseline.stats);
```

Available workload policies: `api`, `worker`, `batch`, `realtime`.

### Operating Profiles

- conservative: lower adaptation frequency, stricter safety envelope
- balanced: default posture for most workloads
- aggressive: faster adaptation and denser feedback loops

```ts
const samiam = new Samiam({ operatingProfile: 'balanced' });
samiam.setOperatingProfile('aggressive');
console.log(samiam.getOperatingProfile());
```

### Lifecycle Events

```ts
const unsubscribe = samiam.onEvent('adaptationApplied', (event) => {
  console.log(event.name, event.data);
});

samiam.onEvent('profileChanged', (event) => {
  console.log('profile changed:', event.data);
});

unsubscribe();
```

Available events: profileChanged, adaptationApplied, syncActionApplied, aiCircuitOpen, aiCallFailed, aiEngagementEvaluated.

### AI Engagement Routing (Investigate, Revise, Repair, Audit, Append)

Use `aiEngagementMode: 'viability-gated'` to keep AI advisory and bounded.

- investigate: AI runs when high-severity entries or sustained error pressure are detected.
- revise and repair: AI runs for manual/shutdown reviews, quality-guard failures, or elevated recent error counts.
- audit: AI runs when enough quality-history evidence exists.
- append: AI runs when recent errors exist and learned-lesson capacity remains.

```ts
const samiam = new Samiam({
  aiEngagementMode: 'viability-gated',
  aiInvestigateErrorRatioThreshold: 0.25,
  aiInvestigateMinRecentErrors: 2,
});

const decision = samiam.assessAiEngagement('investigate');
console.log(decision.engage, decision.reason, decision.intents);
```

Environment policy presets (`Samiam.getEnvironmentAiPolicy(...)`) tune AI engagement by environment:

- dev: faster AI feedback, force review/sync allowed
- staging: viability-gated defaults with force review/sync allowed
- prod: stricter viability thresholds with force review/sync blocked by default when enforcement is enabled

```ts
const samiam = new Samiam({
  runtimeEnvironment: 'prod',
  enforceEnvironmentAiPolicy: true,
});

// Move to staging policy when doing controlled rollout validation.
samiam.setRuntimeEnvironment('staging', true);
```

### Tracing Helpers

```ts
const cid = samiam.startSpan('checkout');
// ...work...
samiam.endSpan(cid, { success: true });

const stop = samiam.timer('cache-refresh');
// ...work...
const durationMs = stop();
```

### Namespaces and Channel Stats

```ts
const root = new Samiam({ minLevel: 'debug' });
const commandLog = root.namespace('command');

commandLog.info('invoked', { command: 'stats' });
console.log(root.getStats());
console.log(commandLog.getChannelStats());
```

### Workload Policy Matrix

Use these defaults as your first design pass, then refine with telemetry.

| Workload | minLevel | notifyOnLevels | operatingProfile | adaptiveReviewLogThreshold | rateLimitMs |
| --- | --- | --- | --- | --- | --- |
| api | info | error, fatal | balanced | 200 | 1500 |
| worker | warn | fatal | conservative | 450 | 2500 |
| batch | info | warn, error, fatal | balanced | 300 | 2000 |
| realtime | warn | error, fatal | conservative | 500 | 3000 |

```ts
const policy = Samiam.getLoggingPolicy('worker');
const samiam = new Samiam();
samiam.applyLoggingPolicy(policy);
```

### Child Logger

```ts
const samiam = new Samiam();
const authLog = samiam.child('auth');
authLog.warn('login attempt failed', { userId: 42 });
```

### Transport and Sync Hooks

Use custom transport and sync handlers to integrate with your existing observability stack.

```ts
const samiam = new Samiam({ enableAdaptiveMode: true });

samiam.setTransport((entry) => {
  myStructuredSink.write(entry);
});

samiam.registerSyncHandler(async (action) => {
  await myOpsBus.publish('samiam.sync-action', action);
});
```

## Method Quick Reference

Use this as a rapid lookup during implementation and incident response.

| Method | Use It For | Typical Timing |
| --- | --- | --- |
| `debug/info/warn/error/fatal` | Structured logs by severity | Application runtime |
| `getStats()` | Aggregate behavior counters | Health checks, dashboards |
| `getHealth()` | Runtime posture and AI circuit status | Incident triage |
| `getQualityMetrics(options?)` | Signal/noise scoring over recent runtime logs | QoL metric checks |
| `recordQualitySnapshot(label?, options?)` | Persist QoL baseline and delta over time | Before and after changes |
| `getQualityHistory(limit?)` | Retrieve recent QoL snapshots for comparisons | Iteration reviews |
| `Samiam.getQualityGuardPolicy(workload)` | Workload baseline thresholds for QoL gates | Policy setup |
| `Samiam.getEnvironmentAiPolicy(environment)` | Environment-specific AI engagement policy defaults | Deployment posture setup |
| `evaluateQualityGuard(options?)` | Pass/fail regression guard on quality snapshots | Release and rollout gates |
| `assessAiEngagement(stage, options?)` | Explain whether AI should engage for a stage | Pre-flight control checks |
| `setRuntimeEnvironment(environment, enforce?)` | Switch dev/staging/prod AI policy posture | Runtime rollout control |
| `getRuntimeEnvironment()` | Inspect active runtime environment posture | Diagnostics and runbooks |
| `setEnvironmentAiPolicyEnforcement(enabled)` | Enable/disable environment policy locking | Safety governance |
| `getAutonomousRecommendations(options?)` | Telemetry-driven, AI-independent tuning advice | During incidents and postmortems |
| `createIncidentRunbook(options?)` | Baseline + hypothesis/change/result incident artifact | Incident kickoff |
| `getTroubleshootingChecklist(topic?)` | Topic-focused triage steps | First-response debugging |
| `getRecentLogs(count, level?)` | Fast local evidence slicing | During debugging |
| `namespace(prefix)` | Module-scoped logging views | Service/module setup |
| `child(prefix)` | Prefixing child logger instances | Subsystem wiring |
| `createCorrelationId(...parts)` | Deterministic trace identifiers | Request/job boundaries |
| `startSpan(name)` / `endSpan(cid)` | Span timing and trace boundaries | Critical path instrumentation |
| `timer(name)` | Lightweight duration measurement | Hot-path timing probes |
| `onEvent(name, handler)` | Runtime event subscriptions | Ops automation hooks |
| `setTransport(fn)` | Route logs to custom sink | Bootstrap/init |
| `setAiProvider(provider)` | Swap model backend | Platform integration |
| `registerSyncHandler(handler)` | Apply sync actions to external systems | Adaptive mode integration |
| `setOperatingProfile(profile)` | Tune safety/speed posture | Environment rollout |
| `forceAdaptiveReview(reason)` | Trigger adaptation review on demand | Manual operations |
| `syncState(reason)` | Push full state for synchronization | Operator-driven sync |
| `close()` | Graceful shutdown and queue drain | Process shutdown |

## Dynamic AI Provider

You can replace the default Grok transport while preserving the same adaptive pipeline.

```ts
samiam.setAiProvider(async (prompt, config) => {
  const response = await myAiClient.complete({
    model: config.grokModel,
    input: prompt,
  });
  return response.text;
});
```

## Package Notes (NPM)

- Module format: CommonJS
- Type definitions: included (`dist/samiam.d.ts`)
- Published artifacts: `dist`, `README.md`, `LICENSE`
- Engine requirement: Node.js 18+

This package is designed for production services that need pragmatic diagnostics, controlled adaptation,
and iterative quality-of-life improvements without sacrificing operational safety.

## Development and Verification

```bash
npm run build
npm run typecheck
npm test
npm run test:coverage
npm run verify
```

Recommended release gate:

```bash
npm run verify && npm pack --dry-run
```

Live simulation gate (no external AI call required):

```bash
npm run simulate:live
```

## Debugger Incident Playbook

When debugging production issues, follow this order to keep triage fast and repeatable.

1. Capture baseline: getHealth plus getStats snapshots.
2. Slice evidence: use namespace and channel stats to isolate noisy areas.
3. Trace path: create correlation IDs and span boundaries for critical operations.
4. Stabilize behavior: temporarily raise minLevel and tighten notifyOnLevels.
5. Review adaptation: inspect emitted events for adaptationApplied and aiCallFailed.
6. Validate fix: run verify, then compare before and after telemetry.

Example baseline capture:

```ts
const health = samiam.getHealth();
const stats = samiam.getStats();
const recentErrors = samiam.getRecentLogs(20, 'error');

console.log({ health, stats, recentErrors });
```

Runbook template (baseline -> hypothesis -> change -> result):

```ts
const baseline = samiam.captureTriageSnapshot({
  label: 'incident-123-baseline',
  channels: ['api', 'api.db'],
});

// apply one small change here (profile, level, retry budget, etc.)

const result = samiam.captureTriageSnapshot({
  label: 'incident-123-result',
  channels: ['api', 'api.db'],
  notes: {
    hypothesis: 'db saturation during peak read load',
    change: 'raised pool and reduced noisy warn logs',
    result: 'error volume down, alert precision improved',
  },
});

console.log({ baseline, result });
```

Autonomous runbook helper (no AI dependency):

```ts
const runbook = samiam.createIncidentRunbook({
  label: 'incident-124',
  hypothesis: 'retry storm triggered by dependency latency',
  changePlan: 'reduce retries and raise timeout guardrail',
  resultPlan: 'compare error ratio and alert volume after 15 minutes',
  channels: ['api', 'api.db'],
});

console.log(runbook.recommendations);
console.log(samiam.getTroubleshootingChecklist('triage'));
```

QoL metrics loop helper:

```ts
const baseline = samiam.recordQualitySnapshot('release-1-baseline');

// apply one bounded policy/config change here

const after = samiam.recordQualitySnapshot('release-1-after');
const history = samiam.getQualityHistory(5);

console.log({
  baseline: baseline.metrics,
  after: after.metrics,
  delta: after.delta,
  historyCount: history.length,
});
```

Quality regression guard (release gate helper):

```ts
const baseline = samiam.recordQualitySnapshot('candidate-baseline');

// apply planned config/policy change

const current = samiam.recordQualitySnapshot('candidate-current');
const guard = samiam.evaluateQualityGuard({
  policy: Samiam.getQualityGuardPolicy('api'),
  baseline,
  current,
});

if (!guard.passed) {
  console.error('Quality gate failed', guard.violations);
}
```

## Troubleshooting Guide

Decision tree for first-response triage:

1. Are errors/fatals present in `getRecentLogs(20, 'error')`?
2. If no: lower noise first (`applyLoggingPolicy('worker')` or raise `minLevel`), then re-check health.
3. If yes: group by module using `namespace(...)` and `getChannelStats(...)`.
4. Is `getHealth().aiCircuitOpen` true?
5. If yes: review timeout/retry budget and `aiCallFailed` events before further adaptive tuning.
6. If no: capture baseline snapshot, apply one bounded change, capture result snapshot, compare.

### Symptom: No AI insights are being stored

1. Confirm `grokApiKey` is set and non-empty.
2. Verify log levels in `notifyOnLevels` include emitted levels.
3. Check `getHealth().aiCircuitOpen` and cooldown timing.
4. Inspect `aiCallFailed` events for transport/provider errors.

### Symptom: Too much log noise

1. Raise `minLevel` to `info` or `warn`.
2. Reduce `notifyOnLevels` to `error` and `fatal`.
3. Use `namespace(...)` and `getChannelStats()` to identify noisy channels.
4. Move high-volume non-actionable logs to `debug`.

### Symptom: Adaptive behavior feels too aggressive

1. Switch to `operatingProfile: 'conservative'`.
2. Increase `adaptiveReviewLogThreshold`.
3. Increase `rateLimitMs` and review retry settings.
4. Enable `strictSyncMode` and disable `allowCustomSyncActions` if needed.

### Symptom: Alerts are frequent but low value

1. Narrow `notifyOnLevels` to actionable severities.
2. Add/expand `sanitizeKeys` to reduce payload noise and sensitive leakage risk.
3. Use baseline and post-change telemetry comparisons before finalizing policy.

## Production Hardening Checklist

Use this checklist before shipping logger/debugger configuration updates.

1. Ensure sanitizeKeys covers tenant and auth-sensitive fields.
2. Keep notifyOnLevels intentional to avoid alert fatigue.
3. Confirm aiRequestTimeoutMs and aiMaxRetries match latency budget.
4. Use strictSyncMode in regulated or high-risk environments.
5. Validate with verify and package with pack dry-run.
6. Record one measurable QoL outcome per release (for example, mean triage time).

## Contributing Workflow

Use short, evidence-driven patch cycles:

1. Choose one debugger/logger QoL target.
2. Implement the smallest viable change.
3. Validate with tests and telemetry outcomes.
4. Keep the change only if it improves operator experience.
5. Repeat.

## Optional Integration Test

Run the real-provider integration test when you have a valid Grok key.

```bash
GROK_API_KEY=your-key npm test
```

You can tune the integration wait window (milliseconds):

```bash
SAMIAM_E2E_WAIT_MS=5000 GROK_API_KEY=your-key npm test
```

## Continuous Co-Development Plan

Use this package as an ongoing co-dev loop:

1. Observe: capture runtime stats, health, and high-signal logs.
2. Hypothesize: define one bounded improvement.
3. Implement: ship a small reversible change with tests.
4. Validate: run npm run verify and compare telemetry deltas.
5. Iterate: keep wins, revert regressions, repeat.

Future iterations should remain incremental, evidence-driven, and backward-aware so behavior stays reliable in production.

For co-dev patching cycles, prefer this cadence:

1. Patch one behavior at a time.
2. Verify with tests and telemetry deltas.
3. Keep only improvements with clear operator value.
4. Repeat in short iterations.

## Professional Mantra And Ethos

- Reliability before novelty.
- Safety over speed.
- Evolution without lock-in.
- Operational clarity.
- Continuous future iteration.

## Support and Links

- Repository: https://github.com/ZeroAsInfinity/logger
- Issues: https://github.com/ZeroAsInfinity/logger/issues

## License

MIT
