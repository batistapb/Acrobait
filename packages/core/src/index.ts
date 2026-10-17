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
export { isMovableAnnotation } from "./annotations/types.js";
export type {
  Annotation,
  AnnotationTool,
  Point,
  HighlightAnnotation,
  FreehandAnnotation,
  CommentAnnotation,
  SignatureAnnotation,
  ImageAnnotation,
  TextEditAnnotation,
  MovableAnnotation,
  NewTextFieldAnnotation,
  NewCheckboxAnnotation,
} from "./annotations/types.js";
export { getPageTextRuns, findTextRunAtPoint } from "./engine/textContent.js";
export type { TextRun } from "./engine/textContent.js";
export { applyPageOrganization, createInitialPageDrafts } from "./pageOps/apply.js";
export { mergeDocuments } from "./pageOps/merge.js";
export { splitDocument } from "./pageOps/split.js";
export type { PageDraft } from "./pageOps/types.js";
export type { SplitResult } from "./pageOps/split.js";
export { getPageFormFields } from "./forms/readFields.js";
export { fillFormFields } from "./forms/fillFields.js";
export type { FormField, FormFieldType, FormFieldValues } from "./forms/types.js";
