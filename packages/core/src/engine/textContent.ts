import { Util } from "pdfjs-dist";
import type { PdfDocumentHandle } from "./renderEngine.js";
import type { Rect, Point } from "./types.js";

export interface TextRun {
  text: string;
  rect: Rect;
  fontSize: number;
}

/**
 * Approximates each text item's bounding box in the same page-space (scale 1,
 * top-left origin) used everywhere else. Ignores rotated/vertical text and
 * trusts pdf.js's own glyph-transform math (Util.transform) rather than the
 * item's `height` field, which pdf.js frequently leaves at 0.
 */
export async function getPageTextRuns(
  handle: PdfDocumentHandle,
  pageIndex: number,
): Promise<TextRun[]> {
  const page = await handle.proxy.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  const runs: TextRun[] = [];
  for (const item of textContent.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const tx = Util.transform(viewport.transform, item.transform);
    const fontSize = Math.hypot(tx[2], tx[3]);
    if (fontSize <= 0) continue;
    runs.push({
      text: item.str,
      rect: { x: tx[4], y: tx[5] - fontSize, width: item.width, height: fontSize },
      fontSize,
    });
  }
  return runs;
}

export function findTextRunAtPoint(runs: TextRun[], point: Point): TextRun | null {
  for (const run of runs) {
    const { x, y, width, height } = run.rect;
    if (point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height) {
      return run;
    }
  }
  return null;
}
