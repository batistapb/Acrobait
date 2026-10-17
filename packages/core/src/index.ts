export type { FileSystemAdapter, OpenedDocument, RecentFile } from "./fs/FileSystemAdapter.js";
export type { Rect, PageRef } from "./engine/types.js";
export {
  configureWorker,
  loadDocument,
  closeDocument,
  getPageSize,
  renderPageToCanvas,
} from "./engine/renderEngine.js";
export type { PdfDocumentHandle, PageSize } from "./engine/renderEngine.js";
export { bakeAnnotations } from "./annotations/bake.js";
export type {
  Annotation,
  AnnotationTool,
  Point,
  HighlightAnnotation,
  FreehandAnnotation,
  CommentAnnotation,
  SignatureAnnotation,
} from "./annotations/types.js";
