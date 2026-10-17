import { PDFDocument } from "pdf-lib";

/** Appends every page of `otherBytes` to the end of `baseBytes`. */
export async function mergeDocuments(
  baseBytes: Uint8Array,
  otherBytes: Uint8Array,
): Promise<Uint8Array> {
  const baseDoc = await PDFDocument.load(baseBytes);
  const otherDoc = await PDFDocument.load(otherBytes);
  const copiedPages = await baseDoc.copyPages(otherDoc, otherDoc.getPageIndices());
  copiedPages.forEach((page) => baseDoc.addPage(page));
  return baseDoc.save();
}
