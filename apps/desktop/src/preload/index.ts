import { contextBridge, ipcRenderer } from "electron";
import type { AcrobaitElectronApi, OpenedFile } from "../shared/electronApi.js";

const api: AcrobaitElectronApi = {
  openFile: (): Promise<OpenedFile | null> => ipcRenderer.invoke("dialog:openFile"),
  saveFile: (bytes: Uint8Array, suggestedName: string, filePath?: string): Promise<void> =>
    ipcRenderer.invoke("dialog:saveFile", bytes, suggestedName, filePath),
};

contextBridge.exposeInMainWorld("api", api);
