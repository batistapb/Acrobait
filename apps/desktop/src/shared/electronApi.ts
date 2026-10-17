export interface OpenedFile {
  bytes: Uint8Array;
  name: string;
  filePath: string;
}

export interface AcrobaitElectronApi {
  openFile(): Promise<OpenedFile | null>;
  saveFile(bytes: Uint8Array, suggestedName: string, filePath?: string): Promise<void>;
}
