import { PDFDocument } from "pdf-lib";

export interface SplitResult {
  first: Uint8Array;
  second: Uint8Array;
}

/** Splits the document into two: pages [0, atPageIndex) and [atPageIndex, end). */
export async function splitDocument(bytes: Uint8Array, atPageIndex: number): Promise<SplitResult> {
  const sourceDoc = await PDFDocument.load(bytes);
  const totalPages = sourceDoc.getPageCount();
  const firstIndices = Array.from({ length: atPageIndex }, (_, i) => i);
  const secondIndices = Array.from({ length: totalPages - atPageIndex }, (_, i) => i + atPageIndex);

  const firstDoc = await PDFDocument.create();
  (await firstDoc.copyPages(sourceDoc, firstIndices)).forEach((page) => firstDoc.addPage(page));

  const secondDoc = await PDFDocument.create();
  (await secondDoc.copyPages(sourceDoc, secondIndices)).forEach((page) => secondDoc.addPage(page));

  return { first: await firstDoc.save(), second: await secondDoc.save() };
}
