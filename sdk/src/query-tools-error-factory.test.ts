import { describe, expect, it } from 'vitest';
import { ErrorClassification, GSDError } from './errors.js';
import {
  failureToolsError,
  timeoutToolsError,
  toToolsErrorFromUnknown,
} from './query-tools-error-factory.js';

describe('query tools error factory', () => {
  it('builds timeout and failure tools errors', () => {
    expect(timeoutToolsError('t', 'state', ['load'], '', 10).classification).toEqual({ kind: 'timeout', timeoutMs: 10 });
    expect(failureToolsError('f', 'state', ['load'], 1).classification).toEqual({ kind: 'failure' });
  });

  it('maps GSDError to failure with semantic exit code', () => {
    const err = toToolsErrorFromUnknown('state', ['load'], new GSDError('bad', ErrorClassification.Validation));
    expect(err.exitCode).toBe(10);
    expect(err.classification).toEqual({ kind: 'failure' });
  });

  it('maps timeout-like unknown errors to timeout classification', () => {
    const err = toToolsErrorFromUnknown('state', ['load'], new Error('gsd-tools timed out after 50ms: state load'));
    expect(err.classification).toEqual({ kind: 'timeout', timeoutMs: 50 });
  });
});
