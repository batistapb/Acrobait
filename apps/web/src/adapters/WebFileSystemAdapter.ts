import type { FileSystemAdapter, OpenedDocument } from "@acrobait/core";

interface FileSystemFileHandleLike {
  getFile(): Promise<File>;
}

interface FileSystemWritableFileStreamLike {
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemFileHandleWithWriteLike extends FileSystemFileHandleLike {
  createWritable(): Promise<FileSystemWritableFileStreamLike>;
}

declare global {
  interface Window {
    showOpenFilePicker?(options?: {
      types?: { description: string; accept: Record<string, string[]> }[];
    }): Promise<FileSystemFileHandleWithWriteLike[]>;
    showSaveFilePicker?(options?: {
      suggestedName?: string;
      types?: { description: string; accept: Record<string, string[]> }[];
    }): Promise<FileSystemFileHandleWithWriteLike>;
  }
}

const PDF_FILE_TYPE = {
  description: "PDF",
  accept: { "application/pdf": [".pdf"] },
};

export class WebFileSystemAdapter implements FileSystemAdapter {
  async openDocument(): Promise<OpenedDocument> {
    if (window.showOpenFilePicker) {
      const [handle] = await window.showOpenFilePicker({ types: [PDF_FILE_TYPE] });
      const file = await handle.getFile();
      const bytes = new Uint8Array(await file.arrayBuffer());
      return { bytes, name: file.name, handle };
    }
    return this.openViaInputElement();
  }

  async saveDocument(bytes: Uint8Array, suggestedName: string, handle?: unknown): Promise<void> {
    const existingHandle = handle as FileSystemFileHandleWithWriteLike | undefined;
    if (existingHandle?.createWritable) {
      const writable = await existingHandle.createWritable();
      await writable.write(bytes);
      await writable.close();
      return;
    }

    if (window.showSaveFilePicker) {
      const newHandle = await window.showSaveFilePicker({
        suggestedName,
        types: [PDF_FILE_TYPE],
      });
      const writable = await newHandle.createWritable();
      await writable.write(bytes);
      await writable.close();
      return;
    }

    this.downloadViaBlob(bytes, suggestedName);
  }

  private openViaInputElement(): Promise<OpenedDocument> {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/pdf,.pdf";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error("Nenhum arquivo selecionado"));
          return;
        }
        file
          .arrayBuffer()
          .then((buffer) => resolve({ bytes: new Uint8Array(buffer), name: file.name }))
          .catch(reject);
      };
      input.click();
    });
  }

  private downloadViaBlob(bytes: Uint8Array, suggestedName: string): void {
    const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = suggestedName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
