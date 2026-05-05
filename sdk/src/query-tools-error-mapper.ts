import { toToolsErrorFromUnknown } from './query-tools-error-factory.js';
import type { GSDToolsError } from './gsd-tools-error.js';

/**
 * Module owning projection of internal errors to GSDToolsError contract.
 */
export function toGSDToolsError(command: string, args: string[], err: unknown): GSDToolsError {
  return toToolsErrorFromUnknown(command, args, err);
}
