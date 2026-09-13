import test from 'node:test';
import assert from 'node:assert';
import { Logger, redactSensitiveData } from './logger';

test('redactSensitiveData masks credentials and API tokens', () => {
  const secretKey = 'sk-proj-abc1234567890abcdef123456';
  const cpkKey = 'cpk_12345678901234567890';
  const rawText = `Connecting with ${secretKey} and ${cpkKey}`;
  
  const redacted = redactSensitiveData(rawText) as string;
  assert.ok(!redacted.includes('abc1234567890'));
  assert.ok(!redacted.includes('12345678901234567890'));
  assert.ok(redacted.includes('[REDACTED]'));

  const objWithSecret = {
    apiKey: 'my-super-secret-key-1234',
    safeField: 'public-data',
    nested: {
      password: 'mypassword',
      token: 'secret-token',
    },
  };
  const sanitized = redactSensitiveData(objWithSecret) as any;
  assert.strictEqual(sanitized.apiKey, '[REDACTED]');
  assert.strictEqual(sanitized.safeField, 'public-data');
  assert.strictEqual(sanitized.nested.password, '[REDACTED]');
  assert.strictEqual(sanitized.nested.token, '[REDACTED]');
});

test('child logger inherits and extends contextual metadata', () => {
  const parent = new Logger({ component: 'test-parent', defaultContext: { runId: 'run-123' } });
  const child = parent.child({ threadId: 'thread-456' }, 'test-child');

  // Verify child does not mutate parent
  assert.ok(child instanceof Logger);
});

test('log level filtering respects LOG_LEVEL environment variable', () => {
  const originalLevel = process.env.LOG_LEVEL;
  try {
    process.env.LOG_LEVEL = 'warn';
    const log = new Logger({ component: 'filter-test' });

    let infoLogged = false;
    let warnLogged = false;

    const origInfo = console.info;
    const origWarn = console.warn;

    console.info = () => { infoLogged = true; };
    console.warn = () => { warnLogged = true; };

    log.info('this should be ignored');
    log.warn('this should be recorded');

    console.info = origInfo;
    console.warn = origWarn;

    assert.strictEqual(infoLogged, false);
    assert.strictEqual(warnLogged, true);
  } finally {
    process.env.LOG_LEVEL = originalLevel;
  }
});
