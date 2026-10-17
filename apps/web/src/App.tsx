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
  FormFieldEditor,
  BrandMarkIcon,
  FolderOpenIcon,
  SaveIcon,
  PagesIcon,
  FormIcon,
  MergeIcon,
  ScissorsIcon,
  type PendingImage,
} from "@acrobait/ui";
import {
  configureWorker,
  loadDocument,
  bakeAnnotations,
  applyPageOrganization,
  createInitialPageDrafts,
  mergeDocuments,
  splitDocument,
  fillFormFields,
  type PdfDocumentHandle,
  type Annotation,
  type AnnotationTool,
  type PageDraft,
  type Rect,
  type FormFieldValues,
} from "@acrobait/core";
import { WebFileSystemAdapter } from "./adapters/WebFileSystemAdapter.js";
import styles from "./App.module.css";

configureWorker(pdfWorkerUrl);

type Mode = "view" | "organize" | "form";

const SIGNATURE_PLACEMENT_SIZE = { width: 160, height: 60 };
const MAX_IMAGE_PLACEMENT_DIMENSION = 220;

function readImageFile(file: File): Promise<PendingImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler a imagem"));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onerror = () => reject(new Error("Falha ao carregar a imagem"));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_PLACEMENT_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
        resolve({ dataUrl, width: img.naturalWidth * scale, height: img.naturalHeight * scale });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

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
  const [color, setColor] = useState("#ffcb3d");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pageDrafts, setPageDrafts] = useState<PageDraft[]>([]);
  const [splitAt, setSplitAt] = useState(1);
  const [formValues, setFormValues] = useState<FormFieldValues>({});

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
    setFormValues({});
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
      const withAnnotations = await bakeAnnotations(originalBytes, annotations);
      const finalBytes = await fillFormFields(withAnnotations, formValues);
      await fs.saveDocument(finalBytes, documentName, fileHandle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar o PDF");
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddAnnotation(annotation: Annotation) {
    setAnnotations((prev) => [...prev, annotation]);
    if (annotation.type === "signature" || annotation.type === "image") {
      setPendingImage(null);
      setTool("select");
    } else if (annotation.type === "textEdit") {
      setTool("select");
    }
  }

  function handleUpdateAnnotation(id: string, rect: Rect) {
    setAnnotations((prev) =>
      prev.map((a) => ((a.type === "signature" || a.type === "image") && a.id === id ? { ...a, rect } : a)),
    );
  }

  function handleCaptureSignature(dataUrl: string) {
    setPendingImage({ dataUrl, ...SIGNATURE_PLACEMENT_SIZE });
  }

  async function handlePickImageFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    try {
      setPendingImage(await readImageFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar a imagem");
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
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <BrandMarkIcon size={20} className={styles.brandMark} />
          <span>Acrobait</span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.fileActions}>
          <button type="button" className="btn btn--ghost" onClick={handleOpen}>
            <FolderOpenIcon size={16} />
            Abrir PDF
          </button>
          {handle && (
            <button type="button" className="btn btn--ghost" onClick={handleSave} disabled={isSaving}>
              <SaveIcon size={16} />
              {isSaving ? "Salvando…" : "Salvar PDF"}
            </button>
          )}
        </div>

        <div className={styles.spacer} />

        {documentName && <span className={styles.docName}>{documentName}</span>}

        {handle && (
          <>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.fileActions}>
              <button
                type="button"
                className="btn btn--ghost"
                aria-pressed={mode === "organize"}
                onClick={() => (mode === "organize" ? handleCancelOrganization() : setMode("organize"))}
              >
                <PagesIcon size={16} />
                Organizar páginas
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                aria-pressed={mode === "form"}
                onClick={() => setMode(mode === "form" ? "view" : "form")}
              >
                <FormIcon size={16} />
                Preencher formulário
              </button>
            </div>
          </>
        )}

        {handle && (mode === "view" || mode === "form") && (
          <>
            <div className={styles.divider} aria-hidden="true" />
            <ZoomControls scale={scale} onScaleChange={setScale} />
          </>
        )}
      </header>

      {handle && mode === "view" && (
        <AnnotationToolbar tool={tool} onToolChange={setTool} color={color} onColorChange={setColor} />
      )}

      {mode === "view" && tool === "signature" && !pendingImage && (
        <SignaturePad onCapture={handleCaptureSignature} />
      )}
      {mode === "view" && tool === "image" && !pendingImage && (
        <div className={styles.hint}>
          <input type="file" accept="image/*" onChange={handlePickImageFile} />
        </div>
      )}
      {mode === "view" && (tool === "signature" || tool === "image") && pendingImage && (
        <p className={styles.hint}>Clique na página para posicionar.</p>
      )}
      {mode === "view" && tool === "text" && (
        <p className={styles.hint}>Clique num texto existente da página para editá-lo.</p>
      )}

      {error && <div className={styles.errorBar}>{error}</div>}

      {handle && mode === "organize" && (
        <>
          <div className={styles.organizeBar}>
            <button type="button" className="btn btn--primary" onClick={handleApplyOrganization}>
              Aplicar alterações
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleCancelOrganization}>
              Cancelar
            </button>
            <div className={styles.divider} aria-hidden="true" />
            <button type="button" className="btn btn--ghost" onClick={handleMerge}>
              <MergeIcon size={16} />
              Adicionar páginas de outro PDF
            </button>
            <div className={styles.splitField}>
              <label htmlFor="split-at">Dividir a partir da página</label>
              <input
                id="split-at"
                type="number"
                className="fieldInput"
                min={1}
                max={Math.max(1, pageDrafts.length - 1)}
                value={splitAt}
                onChange={(event) => setSplitAt(Number(event.target.value))}
              />
            </div>
            <button type="button" className="btn btn--ghost" onClick={handleSplit}>
              <ScissorsIcon size={16} />
              Dividir e exportar
            </button>
          </div>
          <div className={styles.organizeWorkspace}>
            <PageOrganizerGrid handle={handle} pages={pageDrafts} onPagesChange={setPageDrafts} />
          </div>
        </>
      )}

      {handle && (mode === "view" || mode === "form") && (
        <div className={styles.workspace}>
          <ThumbnailSidebar handle={handle} currentPage={pageIndex} onSelectPage={setPageIndex} />
          <div className={styles.canvasArea}>
            <div className={styles.pageStage}>
              <PdfCanvasViewer handle={handle} pageIndex={pageIndex} scale={scale} />
              {mode === "view" ? (
                <AnnotationLayer
                  handle={handle}
                  pageIndex={pageIndex}
                  scale={scale}
                  annotations={annotations}
                  tool={tool}
                  color={color}
                  pendingImage={pendingImage}
                  onAddAnnotation={handleAddAnnotation}
                  onUpdateAnnotation={handleUpdateAnnotation}
                />
              ) : (
                <FormFieldEditor
                  handle={handle}
                  pageIndex={pageIndex}
                  scale={scale}
                  values={formValues}
                  onValuesChange={setFormValues}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {!handle && (
        <div className={styles.empty}>
          <div className={`${styles.emptyCard} panel`}>
            <BrandMarkIcon size={40} className={styles.emptyMark} />
            <p className={styles.emptyTitle}>Nenhum PDF aberto</p>
            <p className={styles.emptyBody}>
              Abra um arquivo para visualizar, anotar, organizar páginas ou preencher formulários.
            </p>
            <button type="button" className="btn btn--primary" onClick={handleOpen}>
              <FolderOpenIcon size={16} />
              Abrir PDF
            </button>
          </div>
        </div>
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
