import type { Rect } from "../engine/types.js";

export type AnnotationTool = "select" | "highlight" | "freehand" | "comment" | "signature";

export interface Point {
  x: number;
  y: number;
}

/**
 * All geometry is in page space at scale 1 with a top-left origin — the same
 * coordinate system pdf.js's getViewport({ scale: 1 }) produces, so overlay
 * math never needs to know the current zoom level until it reads it.
 */
export interface HighlightAnnotation {
  id: string;
  type: "highlight";
  pageIndex: number;
  rect: Rect;
  color: string;
}

export interface FreehandAnnotation {
  id: string;
  type: "freehand";
  pageIndex: number;
  points: Point[];
  color: string;
  strokeWidth: number;
}

export interface CommentAnnotation {
  id: string;
  type: "comment";
  pageIndex: number;
  position: Point;
  text: string;
}

export interface SignatureAnnotation {
  id: string;
  type: "signature";
  pageIndex: number;
  rect: Rect;
  imageDataUrl: string;
}

export type Annotation =
  | HighlightAnnotation
  | FreehandAnnotation
  | CommentAnnotation
  | SignatureAnnotation;
