import { PDFDocument, StandardFonts, rgb, type Color, type PDFFont } from "pdf-lib";
import type { Annotation } from "./types.js";

function hexToColor(hex: string): Color {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Draws our own annotation model onto the PDF's page content via pdf-lib.
 * This bakes marks in as static page content rather than interactive PDF
 * annotation objects (pdf-lib has no API for the latter) — acceptable for
 * v1 since the goal is round-tripping what the user drew, not producing
 * annotation objects a different PDF viewer could toggle on/off.
 */
export async function bakeAnnotations(
  bytes: Uint8Array,
  annotations: Annotation[],
): Promise<Uint8Array> {
  if (annotations.length === 0) {
    return bytes;
  }

  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();
  let helvetica: PDFFont | null = null;

  for (const annotation of annotations) {
    const page = pages[annotation.pageIndex];
    if (!page) continue;
    const { height: pageHeight } = page.getSize();

    switch (annotation.type) {
      case "highlight": {
        const { x, y, width, height } = annotation.rect;
        page.drawRectangle({
          x,
          y: pageHeight - y - height,
          width,
          height,
          color: hexToColor(annotation.color),
          opacity: 0.35,
        });
        break;
      }
      case "freehand": {
        for (let i = 1; i < annotation.points.length; i++) {
          const a = annotation.points[i - 1];
          const b = annotation.points[i];
          page.drawLine({
            start: { x: a.x, y: pageHeight - a.y },
            end: { x: b.x, y: pageHeight - b.y },
            thickness: annotation.strokeWidth,
            color: hexToColor(annotation.color),
          });
        }
        break;
      }
      case "comment": {
        const { x, y } = annotation.position;
        page.drawEllipse({
          x,
          y: pageHeight - y,
          xScale: 6,
          yScale: 6,
          color: rgb(1, 0.82, 0.2),
        });
        if (annotation.text) {
          page.drawText(annotation.text, {
            x: x + 10,
            y: pageHeight - y - 4,
            size: 10,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
        break;
      }
      case "signature":
      case "image": {
        const { x, y, width, height } = annotation.rect;
        const isJpeg = annotation.imageDataUrl.startsWith("data:image/jpeg");
        const imageBytes = dataUrlToBytes(annotation.imageDataUrl);
        const embedded = isJpeg
          ? await pdfDoc.embedJpg(imageBytes)
          : await pdfDoc.embedPng(imageBytes);
        page.drawImage(embedded, {
          x,
          y: pageHeight - y - height,
          width,
          height,
        });
        break;
      }
      case "textEdit": {
        const { x, y, width, height } = annotation.coverRect;
        // Cover the original glyphs, then redraw with a standard font — pdf-lib
        // can't edit an existing content stream's text runs in place (see
        // packages/core/src/engine/textContent.ts for how the run is located).
        page.drawRectangle({
          x,
          y: pageHeight - y - height,
          width,
          height,
          color: rgb(1, 1, 1),
        });
        if (annotation.text) {
          helvetica ??= await pdfDoc.embedFont(StandardFonts.Helvetica);
          page.drawText(annotation.text, {
            x,
            y: pageHeight - y - height,
            size: annotation.fontSize,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
        }
        break;
      }
      case "newTextField": {
        const { x, y, width, height } = annotation.rect;
        const form = pdfDoc.getForm();
        const field = form.createTextField(annotation.fieldName);
        field.addToPage(page, { x, y: pageHeight - y - height, width, height });
        break;
      }
      case "newCheckbox": {
        const { x, y, width, height } = annotation.rect;
        const form = pdfDoc.getForm();
        const field = form.createCheckBox(annotation.fieldName);
        field.addToPage(page, { x, y: pageHeight - y - height, width, height });
        break;
      }
    }
  }

  return pdfDoc.save();
}
