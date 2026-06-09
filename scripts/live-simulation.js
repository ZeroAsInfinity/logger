const Samiam = require('../dist/samiam').default;

async function main() {
  const samiam = new Samiam({
    grokApiKey: 'simulation-key',
    enableAdaptiveMode: true,
    runtimeEnvironment: 'prod',
    enforceEnvironmentAiPolicy: true,
    operatingProfile: 'balanced',
    adaptiveReviewLogThreshold: 5,
    maxContextEntries: 500,
  });

  samiam.setAiProvider(async (prompt) => {
    if (prompt.includes('Synchronize with current debugger/logger state')) {
      return JSON.stringify({
        adaptations: { minLevel: 'info' },
        syncActions: [{ type: 'addSanitizeKey', payload: 'sessionToken' }],
        learnedLessons: ['Prefer bounded retries during incident pressure'],
      });
    }

    return JSON.stringify({
      rootCause: 'Simulated dependency instability under burst traffic',
      fixes: ['Increase rateLimitMs for noisy channels', 'Keep minLevel at info in production'],
      adaptations: { rateLimitMs: 2000 },
      learnedLessons: ['Investigate high error ratio before aggressive adaptation'],
    });
  });

  samiam.onEvent('aiEngagementEvaluated', (event) => {
    const data = event.data || {};
    console.log('[event:aiEngagementEvaluated]', {
      stage: data.stage,
      engage: data.engage,
      reason: data.reason,
      force: data.force,
    });
  });

  samiam.onEvent('adaptationApplied', (event) => {
    console.log('[event:adaptationApplied]', event.data || {});
  });

  console.log('--- Phase 1: Baseline (prod, policy enforced) ---');
  for (let i = 0; i < 4; i++) samiam.info('steady-state heartbeat', { seq: i });
  samiam.recordQualitySnapshot('baseline-prod');

  console.log('Force review in prod (expected blocked by environment policy)');
  await samiam.forceAdaptiveReview('manual');

  console.log('--- Phase 2: Incident pressure ---');
  for (let i = 0; i < 6; i++) {
    samiam.error('database timeout', { operation: 'read', attempt: i + 1 });
  }

  await new Promise((resolve) => setTimeout(resolve, 120));

  const afterIncident = samiam.recordQualitySnapshot('incident-prod');
  const guard = samiam.evaluateQualityGuard({
    policy: Samiam.getQualityGuardPolicy('api'),
  });

  console.log('Quality metrics:', afterIncident.metrics);
  console.log('Quality guard:', {
    ready: guard.ready,
    passed: guard.passed,
    violations: guard.violations,
  });

  console.log('AI engagement assessment (investigate):', samiam.assessAiEngagement('investigate'));

  console.log('--- Phase 3: Switch to staging and force review ---');
  samiam.setRuntimeEnvironment('staging', true);
  await samiam.forceAdaptiveReview('manual');

  await new Promise((resolve) => setTimeout(resolve, 120));

  const runbook = samiam.createIncidentRunbook({
    label: 'sim-incident',
    hypothesis: 'Connection pool saturation from burst workload',
    changePlan: 'Increase rate limit and reduce non-actionable noise',
    resultPlan: 'Observe error ratio drop over 5 minutes',
    channels: ['api'],
  });

  console.log('Runbook recommendations:', runbook.recommendations);
  console.log('Troubleshooting checklist:', samiam.getTroubleshootingChecklist('triage'));
  console.log('Stats summary:', samiam.getStats());

  await samiam.close();
}

main().catch((err) => {
  console.error('Simulation failed:', err);
  process.exitCode = 1;
});
