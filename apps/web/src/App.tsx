import { useMemo, useState } from "react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import {
  FileSystemProvider,
  useFileSystem,
  PdfCanvasViewer,
  ThumbnailSidebar,
  ZoomControls,
} from "@acrobait/ui";
import { configureWorker, loadDocument, type PdfDocumentHandle } from "@acrobait/core";
import { WebFileSystemAdapter } from "./adapters/WebFileSystemAdapter.js";

configureWorker(pdfWorkerUrl);

function Viewer() {
  const fs = useFileSystem();
  const [handle, setHandle] = useState<PdfDocumentHandle | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setError(null);
    try {
      const opened = await fs.openDocument();
      const doc = await loadDocument(opened.bytes);
      setHandle(doc);
      setDocumentName(opened.name);
      setPageIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao abrir o PDF");
    }
  }

  return (
    <div>
      <header>
        <h1>Acrobait</h1>
        <button type="button" onClick={handleOpen}>
          Abrir PDF
        </button>
        {documentName && <span>{documentName}</span>}
        {handle && <ZoomControls scale={scale} onScaleChange={setScale} />}
      </header>

      {error && <p role="alert">{error}</p>}

      {handle ? (
        <div style={{ display: "flex" }}>
          <ThumbnailSidebar handle={handle} currentPage={pageIndex} onSelectPage={setPageIndex} />
          <main>
            <PdfCanvasViewer handle={handle} pageIndex={pageIndex} scale={scale} />
          </main>
        </div>
      ) : (
        <p>Nenhum PDF aberto. Clique em "Abrir PDF" para começar.</p>
      )}
    </div>
  );
}

export function App() {
  const adapter = useMemo(() => new WebFileSystemAdapter(), []);

  return (
    <FileSystemProvider adapter={adapter}>
      <Viewer />
    </FileSystemProvider>
  );
}
