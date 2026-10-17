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
  PageOrganizerGrid,
} from "@acrobait/ui";
import {
  configureWorker,
  loadDocument,
  bakeAnnotations,
  applyPageOrganization,
  createInitialPageDrafts,
  mergeDocuments,
  splitDocument,
  type PdfDocumentHandle,
  type Annotation,
  type AnnotationTool,
  type PageDraft,
} from "@acrobait/core";
import { WebFileSystemAdapter } from "./adapters/WebFileSystemAdapter.js";

configureWorker(pdfWorkerUrl);

type Mode = "view" | "organize";

function Viewer() {
  const fs = useFileSystem();
  const [handle, setHandle] = useState<PdfDocumentHandle | null>(null);
  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [fileHandle, setFileHandle] = useState<unknown>(undefined);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");

  const [tool, setTool] = useState<AnnotationTool>("select");
  const [color, setColor] = useState("#ffd400");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pageDrafts, setPageDrafts] = useState<PageDraft[]>([]);
  const [splitAt, setSplitAt] = useState(1);

  async function loadIntoState(bytes: Uint8Array, name: string, newFileHandle: unknown) {
    const doc = await loadDocument(bytes);
    setHandle(doc);
    setOriginalBytes(bytes);
    setFileHandle(newFileHandle);
    setDocumentName(name);
    setPageIndex(0);
    setAnnotations([]);
    setPageDrafts(createInitialPageDrafts(doc.pageCount));
    setSplitAt(1);
  }

  async function handleOpen() {
    setError(null);
    try {
      const opened = await fs.openDocument();
      await loadIntoState(opened.bytes, opened.name, opened.handle);
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

  async function handleApplyOrganization() {
    if (!originalBytes || !documentName) return;
    setError(null);
    try {
      const newBytes = await applyPageOrganization(originalBytes, pageDrafts);
      await loadIntoState(newBytes, documentName, fileHandle);
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao aplicar as alterações");
    }
  }

  function handleCancelOrganization() {
    if (handle) setPageDrafts(createInitialPageDrafts(handle.pageCount));
    setMode("view");
  }

  async function handleMerge() {
    if (!originalBytes || !documentName) return;
    setError(null);
    try {
      const opened = await fs.openDocument();
      const merged = await mergeDocuments(originalBytes, opened.bytes);
      await loadIntoState(merged, documentName, fileHandle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao mesclar PDFs");
    }
  }

  async function handleSplit() {
    if (!originalBytes || !documentName) return;
    setError(null);
    try {
      const { first, second } = await splitDocument(originalBytes, splitAt);
      const base = documentName.replace(/\.pdf$/i, "");
      await fs.saveDocument(first, `${base}-parte1.pdf`);
      await fs.saveDocument(second, `${base}-parte2.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao dividir o PDF");
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
        {handle && (
          <button
            type="button"
            onClick={() => (mode === "organize" ? handleCancelOrganization() : setMode("organize"))}
          >
            {mode === "organize" ? "Voltar à visualização" : "Organizar páginas"}
          </button>
        )}
        {documentName && <span>{documentName}</span>}
        {handle && mode === "view" && <ZoomControls scale={scale} onScaleChange={setScale} />}
      </header>

      {handle && mode === "view" && (
        <AnnotationToolbar tool={tool} onToolChange={setTool} color={color} onColorChange={setColor} />
      )}

      {mode === "view" && tool === "signature" && !pendingSignature && (
        <SignaturePad onCapture={setPendingSignature} />
      )}
      {mode === "view" && tool === "signature" && pendingSignature && (
        <p>Clique na página para posicionar a assinatura.</p>
      )}

      {error && <p role="alert">{error}</p>}

      {handle && mode === "organize" && (
        <div>
          <div>
            <button type="button" onClick={handleApplyOrganization}>
              Aplicar alterações
            </button>
            <button type="button" onClick={handleCancelOrganization}>
              Cancelar
            </button>
            <button type="button" onClick={handleMerge}>
              Adicionar páginas de outro PDF
            </button>
            <label>
              Dividir a partir da página
              <input
                type="number"
                min={1}
                max={Math.max(1, pageDrafts.length - 1)}
                value={splitAt}
                onChange={(event) => setSplitAt(Number(event.target.value))}
              />
            </label>
            <button type="button" onClick={handleSplit}>
              Dividir e exportar
            </button>
          </div>
          <PageOrganizerGrid handle={handle} pages={pageDrafts} onPagesChange={setPageDrafts} />
        </div>
      )}

      {handle && mode === "view" ? (
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
      ) : null}

      {!handle && <p>Nenhum PDF aberto. Clique em "Abrir PDF" para começar.</p>}
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
