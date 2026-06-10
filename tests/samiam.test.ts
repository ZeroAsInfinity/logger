import Samiam from '../src/samiam';

const wait = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

describe('Samiam basic runtime behavior', () => {
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it('sanitizes sensitive keys and records stats', () => {
    const samiam = new Samiam({ minLevel: 'debug', enableAdaptiveMode: false, captureErrorStack: false });
    samiam.setTransport(() => {});

    samiam.info('service started', { token: 'abc', nested: { password: 'secret' } });

    const recent = samiam.getRecentLogs(1);
    expect(recent).toHaveLength(1);
    expect(recent[0].meta.token).toBe('[REDACTED]');
    expect(recent[0].meta.nested.password).toBe('[REDACTED]');

    const stats = samiam.getStats();
    expect(stats.totalLogs).toBe(1);
    expect(stats.bufferSize).toBe(1);
  });

  it('supports namespace logging and channel stats', () => {
    const samiam = new Samiam({ minLevel: 'debug', enableAdaptiveMode: false });
    samiam.setTransport(() => {});
    const api = samiam.namespace('api');

    api.warn('latency spike', { p95: 420 });

    const channelStats = samiam.getChannelStats('api');
    expect(channelStats.totalLogs).toBe(1);
    expect(channelStats.byLevel.warn).toBe(1);
  });

  it('tracks quality snapshot history and evaluates a guard', () => {
    const samiam = new Samiam({ minLevel: 'debug', enableAdaptiveMode: false });
    samiam.setTransport(() => {});

    for (let i = 0; i < 40; i += 1) {
      samiam.info(`warmup-${i}`, { idx: i });
    }
    samiam.error('incident', { code: 'E_TIMEOUT' });

    const baseline = samiam.recordQualitySnapshot('baseline');

    for (let i = 0; i < 40; i += 1) {
      samiam.info(`steady-${i}`, { idx: i });
    }
    samiam.error('incident-2', { code: 'E_TIMEOUT' });

    const current = samiam.recordQualitySnapshot('current');
    const result = samiam.evaluateQualityGuard({ baseline, current });

    expect(result.ready).toBe(true);
    expect(typeof result.passed).toBe('boolean');
    expect(samiam.getQualityHistory(2).length).toBe(2);
  });

  it('opens AI circuit after consecutive provider failures', async () => {
    const samiam = new Samiam({
      grokApiKey: 'test-key',
      minLevel: 'debug',
      enableAdaptiveMode: false,
      aiEngagementMode: 'always-on',
      aiMaxRetries: 0,
      aiCircuitBreakerFailures: 1,
      notifyOnLevels: ['error'],
      rateLimitMs: 100,
    });
    samiam.setTransport(() => {});
    samiam.setAiProvider(async () => {
      throw new Error('provider failure');
    });

    const circuitOpened = new Promise<void>((resolve) => {
      samiam.onEvent('aiCircuitOpen', () => resolve());
    });

    samiam.error('trigger-ai-failure', { stage: 'test' });
    await circuitOpened;

    const latestError = samiam.getRecentLogs(1, 'error')[0];
    const decision = samiam.assessAiEngagement('investigate', { entry: latestError });

    expect(samiam.getHealth().aiCircuitOpen).toBe(true);
    expect(decision.engage).toBe(false);
    expect(decision.reason).toBe('AI circuit is open');

    await samiam.close();
  });

  it('blocks forced sync in enforced prod environment policy', async () => {
    const samiam = new Samiam({
      minLevel: 'debug',
      enableAdaptiveMode: false,
      runtimeEnvironment: 'prod',
      enforceEnvironmentAiPolicy: true,
    });
    samiam.setTransport(() => {});

    const before = samiam.getStats().aiPolicySkips;
    await samiam.syncState('manual');
    const after = samiam.getStats().aiPolicySkips;

    expect(after).toBe(before + 1);
    expect(samiam.getRuntimeEnvironment()).toBe('prod');
  });

  it('tracks retry attempts and recovers when provider eventually succeeds', async () => {
    let attempts = 0;
    const samiam = new Samiam({
      grokApiKey: 'test-key',
      minLevel: 'debug',
      enableAdaptiveMode: false,
      aiEngagementMode: 'always-on',
      aiMaxRetries: 2,
      aiRetryBaseDelayMs: 1,
      aiRequestTimeoutMs: 100,
      notifyOnLevels: ['error'],
      rateLimitMs: 100,
    });
    samiam.setTransport(() => {});
    samiam.setAiProvider(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('transient provider failure');
      return '{"rootCause":"temporary upstream failure","fixes":["retry succeeded"]}';
    });

    samiam.error('trigger-retry', { stage: 'test' });
    for (let i = 0; i < 40 && attempts < 3; i += 1) {
      await wait(5);
    }

    const stats = samiam.getStats();
    expect(attempts).toBe(3);
    expect(stats.aiRetryAttempts).toBe(2);
    expect(stats.grokErrors).toBe(0);

    await samiam.close();
  });

  it('does not execute custom sync actions when strict policy blocks them', async () => {
    const syncHandler = jest.fn(async () => {});
    const samiam = new Samiam({
      grokApiKey: 'test-key',
      minLevel: 'debug',
      enableAdaptiveMode: false,
      aiEngagementMode: 'always-on',
      strictSyncMode: true,
      allowCustomSyncActions: false,
      notifyOnLevels: ['error'],
      rateLimitMs: 100,
    });
    samiam.setTransport(() => {});
    samiam.registerSyncHandler(syncHandler);
    samiam.setAiProvider(async () =>
      '{"syncActions":[{"type":"custom","payload":{"target":"ops"},"reason":"policy-test"}]}'
    );

    samiam.error('trigger-custom-sync', { stage: 'test' });
    await wait(30);

    expect(syncHandler).not.toHaveBeenCalled();
    expect(samiam.getStats().syncActionsApplied).toBe(0);

    await samiam.close();
  });

  it('executes custom sync actions when strict mode allows them', async () => {
    const syncHandler = jest.fn(async () => {});
    const samiam = new Samiam({
      grokApiKey: 'test-key',
      minLevel: 'debug',
      enableAdaptiveMode: false,
      aiEngagementMode: 'always-on',
      strictSyncMode: true,
      allowCustomSyncActions: true,
      notifyOnLevels: ['error'],
      rateLimitMs: 100,
    });
    samiam.setTransport(() => {});
    samiam.registerSyncHandler(syncHandler);
    samiam.setAiProvider(async () =>
      '{"syncActions":[{"type":"custom","payload":{"target":"ops"},"reason":"policy-test"}]}'
    );

    const actionApplied = new Promise<void>((resolve) => {
      samiam.onEvent('syncActionApplied', () => resolve());
    });

    samiam.error('trigger-custom-sync-allowed', { stage: 'test' });
    await actionApplied;

    expect(syncHandler).toHaveBeenCalledTimes(1);
    expect(samiam.getStats().syncActionsApplied).toBe(1);

    await samiam.close();
  });

  it('applies adaptive review changes when forced manually', async () => {
    const samiam = new Samiam({
      grokApiKey: 'test-key',
      minLevel: 'debug',
      enableAdaptiveMode: true,
      aiEngagementMode: 'viability-gated',
      notifyOnLevels: ['error'],
      rateLimitMs: 100,
    });
    samiam.setTransport(() => {});
    samiam.setAiProvider(async () => '{"adaptations":{"minLevel":"warn"},"learnedLessons":["manual review applied"]}');

    await samiam.forceAdaptiveReview('manual');

    const state = samiam.getSyncState();
    expect(state.config.minLevel).toBe('warn');
    expect(state.learned.lessons).toContain('manual review applied');
    expect(state.stats.adaptationsApplied).toBeGreaterThan(0);

    await samiam.close();
  });

  it('triggers adaptive review at log-threshold under error pressure', async () => {
    let calls = 0;
    const samiam = new Samiam({
      grokApiKey: 'test-key',
      minLevel: 'debug',
      enableAdaptiveMode: true,
      aiEngagementMode: 'viability-gated',
      aiInvestigateMinRecentErrors: 1,
      adaptiveReviewLogThreshold: 1,
      notifyOnLevels: [],
      rateLimitMs: 100,
    });
    samiam.setTransport(() => {});
    samiam.setAiProvider(async () => {
      calls += 1;
      return '{"learnedLessons":["threshold review"]}';
    });

    samiam.error('trigger-threshold-review', { stage: 'test' });
    for (let i = 0; i < 40 && calls < 1; i += 1) {
      await wait(5);
    }

    let learnedApplied = false;
    for (let i = 0; i < 40; i += 1) {
      const state = samiam.getSyncState();
      if (state.learned.lessons.includes('threshold review')) {
        learnedApplied = true;
        break;
      }
      await wait(5);
    }

    expect(calls).toBeGreaterThan(0);
    expect(learnedApplied).toBe(true);

    await samiam.close();
  });

  it('runs adaptive review on shutdown when adaptive mode is enabled', async () => {
    let calls = 0;
    const samiam = new Samiam({
      grokApiKey: 'test-key',
      minLevel: 'debug',
      enableAdaptiveMode: true,
      aiEngagementMode: 'always-on',
      notifyOnLevels: ['error'],
      adaptiveReviewLogThreshold: 1000,
      rateLimitMs: 100,
    });
    samiam.setTransport(() => {});
    samiam.setAiProvider(async () => {
      calls += 1;
      return '{"learnedLessons":["shutdown review"]}';
    });

    await samiam.close();

    expect(calls).toBeGreaterThan(0);
  });

  it('applies enforced environment policy when switching runtimes', () => {
    const samiam = new Samiam({
      runtimeEnvironment: 'staging',
      enforceEnvironmentAiPolicy: true,
      enableAdaptiveMode: false,
    });
    samiam.setTransport(() => {});

    samiam.setRuntimeEnvironment('prod', true);
    let state = samiam.getSyncState();
    expect(state.config.runtimeEnvironment).toBe('prod');
    expect(state.config.aiEngagementMode).toBe('viability-gated');
    expect(state.config.aiInvestigateErrorRatioThreshold).toBe(0.35);
    expect(state.config.aiInvestigateMinRecentErrors).toBe(4);

    samiam.setRuntimeEnvironment('dev', true);
    state = samiam.getSyncState();
    expect(state.config.runtimeEnvironment).toBe('dev');
    expect(state.config.aiEngagementMode).toBe('always-on');
    expect(state.config.aiInvestigateErrorRatioThreshold).toBe(0.15);
    expect(state.config.aiInvestigateMinRecentErrors).toBe(1);
  });
});
