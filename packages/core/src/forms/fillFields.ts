import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from "pdf-lib";
import type { FormFieldValues } from "./types.js";

/** Writes user-entered values back into the PDF's existing AcroForm fields. */
export async function fillFormFields(
  bytes: Uint8Array,
  values: FormFieldValues,
): Promise<Uint8Array> {
  if (Object.keys(values).length === 0) {
    return bytes;
  }

  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();

  for (const [name, value] of Object.entries(values)) {
    const field = form.getFieldMaybe(name);
    if (!field) continue;

    if (field instanceof PDFTextField) {
      field.setText(typeof value === "string" ? value : "");
    } else if (field instanceof PDFCheckBox) {
      if (value) field.check();
      else field.uncheck();
    } else if (field instanceof PDFDropdown) {
      if (typeof value === "string" && value) field.select(value);
    } else if (field instanceof PDFRadioGroup) {
      if (typeof value === "string" && value) field.select(value);
    }
  }

  return pdfDoc.save();
}
