import type { QueryDispatchError, QueryDispatchResult } from './query-dispatch-contract.js';
import { toFailureSignal } from '../query-failure-classification.js';
import { fallbackFailureError, nativeFailureError, nativeTimeoutError } from './query-error-taxonomy.js';
import { dispatchFailure } from './query-dispatch-result-builder.js';

export function toDispatchFailure(
  error: QueryDispatchError,
  stderr: string[] = [],
): QueryDispatchResult {
  return dispatchFailure(error, stderr);
}

export function mapNativeDispatchError(error: unknown, command: string, args: string[]): QueryDispatchError {
  const signal = toFailureSignal(error);
  if (signal.kind === 'timeout') {
    return nativeTimeoutError({ message: signal.message, command, args, timeoutMs: signal.timeoutMs });
  }
  return nativeFailureError({ message: signal.message, command, args });
}

export function mapFallbackDispatchError(error: unknown, command: string, args: string[]): QueryDispatchError {
  const signal = toFailureSignal(error);
  return fallbackFailureError({ message: signal.message, command, args, backend: 'cjs' });
}
