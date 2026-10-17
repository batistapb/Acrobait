import type { PdfDocumentHandle } from "../engine/renderEngine.js";
import type { FormField } from "./types.js";

// pdf.js's getAnnotations() return type is untyped (`any[]`); this is the
// subset of the widget-annotation shape we rely on.
interface RawWidgetAnnotation {
  fieldName?: string;
  fieldType?: string;
  fieldValue?: string | string[];
  rect?: [number, number, number, number];
  radioButton?: boolean;
  checkBox?: boolean;
  options?: { exportValue: string; displayValue: string }[];
}

/**
 * Reads existing AcroForm widgets for one page via pdf.js, positioned in the
 * same page-space (scale 1, top-left origin) used everywhere else in the
 * app. Filling values is a separate, pdf-lib-based step (see fillFields.ts)
 * — pdf.js only gives us the form's current shape, not a way to mutate it.
 */
export async function getPageFormFields(
  handle: PdfDocumentHandle,
  pageIndex: number,
): Promise<FormField[]> {
  const page = await handle.proxy.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const annotations = (await page.getAnnotations({ intent: "display" })) as RawWidgetAnnotation[];

  const fields: FormField[] = [];
  for (const ann of annotations) {
    if (!ann.fieldName || !ann.rect) continue;
    const [x1, y1, x2, y2] = ann.rect;
    const rect = { x: x1, y: viewport.height - y2, width: x2 - x1, height: y2 - y1 };
    const value = typeof ann.fieldValue === "string" ? ann.fieldValue : (ann.fieldValue?.[0] ?? "");

    if (ann.fieldType === "Tx") {
      fields.push({ name: ann.fieldName, type: "text", pageIndex, rect, value });
    } else if (ann.fieldType === "Btn" && (ann.checkBox || ann.radioButton)) {
      fields.push({
        name: ann.fieldName,
        type: ann.radioButton ? "radio" : "checkbox",
        pageIndex,
        rect,
        value,
        checked: !!value && value !== "Off",
      });
    } else if (ann.fieldType === "Ch") {
      fields.push({
        name: ann.fieldName,
        type: "dropdown",
        pageIndex,
        rect,
        value,
        options: ann.options?.map((o) => o.displayValue ?? o.exportValue) ?? [],
      });
    }
  }
  return fields;
}
