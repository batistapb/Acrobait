import type { Rect, Point } from "../engine/types.js";

export type { Point } from "../engine/types.js";

export type AnnotationTool =
  | "select"
  | "highlight"
  | "freehand"
  | "comment"
  | "signature"
  | "image"
  | "text"
  | "newTextField"
  | "newCheckbox";

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

export interface ImageAnnotation {
  id: string;
  type: "image";
  pageIndex: number;
  rect: Rect;
  imageDataUrl: string;
}

/**
 * v1 "cover and replace" text edit: paints a cover rect over the original
 * text run and draws the replacement in a standard font. See
 * packages/core/src/annotations/bake.ts for the rationale.
 */
export interface TextEditAnnotation {
  id: string;
  type: "textEdit";
  pageIndex: number;
  coverRect: Rect;
  text: string;
  fontSize: number;
}

/** Places a brand-new AcroForm text field; baked via pdf-lib's form.createTextField. */
export interface NewTextFieldAnnotation {
  id: string;
  type: "newTextField";
  pageIndex: number;
  rect: Rect;
  fieldName: string;
}

/** Places a brand-new AcroForm checkbox; baked via pdf-lib's form.createCheckBox. */
export interface NewCheckboxAnnotation {
  id: string;
  type: "newCheckbox";
  pageIndex: number;
  rect: Rect;
  fieldName: string;
}

export type Annotation =
  | HighlightAnnotation
  | FreehandAnnotation
  | CommentAnnotation
  | SignatureAnnotation
  | ImageAnnotation
  | TextEditAnnotation
  | NewTextFieldAnnotation
  | NewCheckboxAnnotation;

export type MovableAnnotation = SignatureAnnotation | ImageAnnotation;

export function isMovableAnnotation(annotation: Annotation): annotation is MovableAnnotation {
  return annotation.type === "signature" || annotation.type === "image";
}
