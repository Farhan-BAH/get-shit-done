import { GSDError, exitCodeFor } from './errors.js';
import { GSDToolsError } from './gsd-tools-error.js';
import { isTimeoutMessage, errorMessage, parseTimeoutMs } from './query-failure-classification.js';

/**
 * Module owning projection of internal errors to GSDToolsError contract.
 */
export function toGSDToolsError(command: string, args: string[], err: unknown): GSDToolsError {
  if (err instanceof GSDError) {
    return new GSDToolsError(
      err.message,
      command,
      args,
      exitCodeFor(err.classification),
      '',
      { cause: err },
    );
  }

  const msg = errorMessage(err);
  return new GSDToolsError(
    msg,
    command,
    args,
    1,
    '',
    err instanceof Error
      ? {
          cause: err,
          ...(isTimeoutMessage(msg)
            ? { classification: { kind: 'timeout' as const, timeoutMs: parseTimeoutMs(msg) } }
            : undefined),
        }
      : (isTimeoutMessage(msg)
        ? { classification: { kind: 'timeout' as const, timeoutMs: parseTimeoutMs(msg) } }
        : undefined),
  );
}
