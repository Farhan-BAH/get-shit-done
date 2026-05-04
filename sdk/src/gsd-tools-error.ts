export interface GSDToolsErrorClassification {
  kind: 'timeout' | 'failure';
  timeoutMs?: number;
}

export class GSDToolsError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly args: string[],
    public readonly exitCode: number | null,
    public readonly stderr: string,
    options?: { cause?: unknown; classification?: GSDToolsErrorClassification },
  ) {
    super(message, options);
    this.name = 'GSDToolsError';
    this.classification = options?.classification;
  }

  public readonly classification?: GSDToolsErrorClassification;
}
