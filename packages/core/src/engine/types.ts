export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PageRef {
  index: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
}
