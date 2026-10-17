import { useMemo } from "react";
import { FileSystemProvider } from "@acrobait/ui";
import { WebFileSystemAdapter } from "./adapters/WebFileSystemAdapter.js";

export function App() {
  const adapter = useMemo(() => new WebFileSystemAdapter(), []);

  return (
    <FileSystemProvider adapter={adapter}>
      <main>
        <h1>Acrobait</h1>
        <p>Scaffold do monorepo pronto. Visualizador de PDF chega na Fase 1.</p>
      </main>
    </FileSystemProvider>
  );
}
