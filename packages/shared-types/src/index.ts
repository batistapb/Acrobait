export type DocumentBytes = Uint8Array;

export interface DocumentMeta {
  name: string;
  pageCount: number;
}

export type AnnotationType = "highlight" | "comment" | "freehand" | "signature";

export interface AnnotationBase {
  id: string;
  type: AnnotationType;
  pageIndex: number;
}

export type PageOperation =
  | { kind: "rotate"; pageIndex: number; degrees: 90 | 180 | 270 }
  | { kind: "delete"; pageIndex: number }
  | { kind: "reorder"; fromIndex: number; toIndex: number }
  | { kind: "merge"; sourceBytes: DocumentBytes }
  | { kind: "split"; atPageIndex: number };
