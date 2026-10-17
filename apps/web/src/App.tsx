import { useMemo, useState } from "react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import {
  FileSystemProvider,
  useFileSystem,
  PdfCanvasViewer,
  ThumbnailSidebar,
  ZoomControls,
  AnnotationLayer,
  AnnotationToolbar,
  SignaturePad,
} from "@acrobait/ui";
import {
  configureWorker,
  loadDocument,
  bakeAnnotations,
  type PdfDocumentHandle,
  type Annotation,
  type AnnotationTool,
} from "@acrobait/core";
import { WebFileSystemAdapter } from "./adapters/WebFileSystemAdapter.js";

configureWorker(pdfWorkerUrl);

function Viewer() {
  const fs = useFileSystem();
  const [handle, setHandle] = useState<PdfDocumentHandle | null>(null);
  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [fileHandle, setFileHandle] = useState<unknown>(undefined);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [tool, setTool] = useState<AnnotationTool>("select");
  const [color, setColor] = useState("#ffd400");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleOpen() {
    setError(null);
    try {
      const opened = await fs.openDocument();
      const doc = await loadDocument(opened.bytes);
      setHandle(doc);
      setOriginalBytes(opened.bytes);
      setFileHandle(opened.handle);
      setDocumentName(opened.name);
      setPageIndex(0);
      setAnnotations([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao abrir o PDF");
    }
  }

  async function handleSave() {
    if (!originalBytes || !documentName) return;
    setError(null);
    setIsSaving(true);
    try {
      const finalBytes = await bakeAnnotations(originalBytes, annotations);
      await fs.saveDocument(finalBytes, documentName, fileHandle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar o PDF");
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddAnnotation(annotation: Annotation) {
    setAnnotations((prev) => [...prev, annotation]);
    if (annotation.type === "signature") {
      setPendingSignature(null);
      setTool("select");
    }
  }

  return (
    <div>
      <header>
        <h1>Acrobait</h1>
        <button type="button" onClick={handleOpen}>
          Abrir PDF
        </button>
        {handle && (
          <button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando…" : "Salvar PDF"}
          </button>
        )}
        {documentName && <span>{documentName}</span>}
        {handle && <ZoomControls scale={scale} onScaleChange={setScale} />}
      </header>

      {handle && (
        <AnnotationToolbar tool={tool} onToolChange={setTool} color={color} onColorChange={setColor} />
      )}

      {tool === "signature" && !pendingSignature && (
        <SignaturePad onCapture={setPendingSignature} />
      )}
      {tool === "signature" && pendingSignature && (
        <p>Clique na página para posicionar a assinatura.</p>
      )}

      {error && <p role="alert">{error}</p>}

      {handle ? (
        <div style={{ display: "flex" }}>
          <ThumbnailSidebar handle={handle} currentPage={pageIndex} onSelectPage={setPageIndex} />
          <main style={{ position: "relative", display: "inline-block" }}>
            <PdfCanvasViewer handle={handle} pageIndex={pageIndex} scale={scale} />
            <AnnotationLayer
              pageIndex={pageIndex}
              scale={scale}
              annotations={annotations}
              tool={tool}
              color={color}
              pendingSignature={pendingSignature}
              onAddAnnotation={handleAddAnnotation}
            />
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
