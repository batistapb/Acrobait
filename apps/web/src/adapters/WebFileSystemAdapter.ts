import type { FileSystemAdapter, OpenedDocument } from "@acrobait/core";

export class WebFileSystemAdapter implements FileSystemAdapter {
  async openDocument(): Promise<OpenedDocument> {
    throw new Error("WebFileSystemAdapter.openDocument not implemented yet (Phase 1)");
  }

  async saveDocument(): Promise<void> {
    throw new Error("WebFileSystemAdapter.saveDocument not implemented yet (Phase 1)");
  }
}
