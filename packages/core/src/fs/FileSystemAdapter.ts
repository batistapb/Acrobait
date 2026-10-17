export interface RecentFile {
  name: string;
  handle?: unknown;
}

export interface OpenedDocument {
  bytes: Uint8Array;
  name: string;
  handle?: unknown;
}

export interface FileSystemAdapter {
  openDocument(): Promise<OpenedDocument>;
  saveDocument(bytes: Uint8Array, suggestedName: string, handle?: unknown): Promise<void>;
  readRecent?(): Promise<RecentFile[]>;
}
