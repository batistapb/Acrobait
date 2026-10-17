import * as pdfjsLib from "pdfjs-dist";
import { RenderingCancelledException } from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export interface PdfDocumentHandle {
  proxy: PDFDocumentProxy;
  pageCount: number;
}

export interface PageSize {
  width: number;
  height: number;
}

let workerConfigured = false;

export function configureWorker(workerSrc: string): void {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  workerConfigured = true;
}

export async function loadDocument(bytes: Uint8Array): Promise<PdfDocumentHandle> {
  if (!workerConfigured) {
    throw new Error("PDF worker not configured. Call configureWorker() once at app startup.");
  }
  // pdf.js transfers the underlying ArrayBuffer to its worker, detaching it on the
  // main thread. Pass a copy so callers can safely keep using their original bytes
  // afterward (e.g. for pdf-lib operations on the same document).
  const proxy = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  return { proxy, pageCount: proxy.numPages };
}

export async function closeDocument(handle: PdfDocumentHandle): Promise<void> {
  await handle.proxy.destroy();
}

export async function getPageSize(handle: PdfDocumentHandle, pageIndex: number): Promise<PageSize> {
  const page = await handle.proxy.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  return { width: viewport.width, height: viewport.height };
}

// pdf.js rejects a render() call if the same canvas is already mid-render, which
// happens any time pageIndex/scale change faster than the previous render finishes
// (rapid zoom/page clicks, React StrictMode's double-invoked effects, etc). Track an
// in-flight task and a generation token per canvas so a newer call cancels/supersedes
// an older one instead of both racing to draw on the same canvas.
const activeRenderTasks = new WeakMap<HTMLCanvasElement, RenderTask>();
const renderGenerations = new WeakMap<HTMLCanvasElement, number>();

export async function renderPageToCanvas(
  handle: PdfDocumentHandle,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  scale: number,
): Promise<void> {
  const myGeneration = (renderGenerations.get(canvas) ?? 0) + 1;
  renderGenerations.set(canvas, myGeneration);
  activeRenderTasks.get(canvas)?.cancel();

  const page = await handle.proxy.getPage(pageIndex + 1);
  if (renderGenerations.get(canvas) !== myGeneration) {
    return; // superseded by a newer render call while awaiting getPage()
  }

  const viewport = page.getViewport({ scale });
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderTask = page.render({ canvasContext: context, viewport });
  activeRenderTasks.set(canvas, renderTask);
  try {
    await renderTask.promise;
  } catch (error) {
    if (!(error instanceof RenderingCancelledException)) {
      throw error;
    }
  } finally {
    if (activeRenderTasks.get(canvas) === renderTask) {
      activeRenderTasks.delete(canvas);
    }
  }
}
