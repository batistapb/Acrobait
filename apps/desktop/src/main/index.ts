import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { join, basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";

const PDF_FILTER = [{ name: "PDF", extensions: ["pdf"] }];

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 760,
    minHeight: 480,
    backgroundColor: "#1c2128",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

ipcMain.handle("dialog:openFile", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: PDF_FILTER,
    properties: ["openFile"],
  });
  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  const buffer = await readFile(filePath);
  return { bytes: new Uint8Array(buffer), name: basename(filePath), filePath };
});

ipcMain.handle(
  "dialog:saveFile",
  async (_event, bytes: Uint8Array, suggestedName: string, filePath?: string) => {
    let targetPath = filePath;
    if (!targetPath) {
      const { canceled, filePath: chosen } = await dialog.showSaveDialog({
        defaultPath: suggestedName,
        filters: PDF_FILTER,
      });
      if (canceled || !chosen) return;
      targetPath = chosen;
    }
    await writeFile(targetPath, bytes);
  },
);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
