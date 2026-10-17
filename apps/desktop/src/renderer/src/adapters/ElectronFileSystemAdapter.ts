import type { FileSystemAdapter, OpenedDocument } from "@acrobait/core";
import type { AcrobaitElectronApi } from "../../../shared/electronApi.js";

declare global {
  interface Window {
    api: AcrobaitElectronApi;
  }
}

/** Delegates file I/O to the main process via the preload-exposed `window.api`. */
export class ElectronFileSystemAdapter implements FileSystemAdapter {
  async openDocument(): Promise<OpenedDocument> {
    const result = await window.api.openFile();
    if (!result) {
      throw new Error("Nenhum arquivo selecionado");
    }
    return { bytes: result.bytes, name: result.name, handle: result.filePath };
  }

  async saveDocument(bytes: Uint8Array, suggestedName: string, handle?: unknown): Promise<void> {
    const filePath = typeof handle === "string" ? handle : undefined;
    await window.api.saveFile(bytes, suggestedName, filePath);
  }
}
