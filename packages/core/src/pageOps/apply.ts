import { PDFDocument, degrees } from "pdf-lib";
import type { PageDraft } from "./types.js";

/**
 * Reorders, rotates and/or drops pages in a single pdf-lib pass. `pages`
 * describes the desired final layout: its array order is the new page
 * order, each entry's sourceIndex points back into the original document,
 * and any original page not referenced is dropped (delete).
 */
export async function applyPageOrganization(
  bytes: Uint8Array,
  pages: PageDraft[],
): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(bytes);
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(
    sourceDoc,
    pages.map((p) => p.sourceIndex),
  );

  copiedPages.forEach((page, i) => {
    const draft = pages[i];
    if (draft.rotationDelta !== 0) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + draft.rotationDelta) % 360));
    }
    newDoc.addPage(page);
  });

  return newDoc.save();
}

export function createInitialPageDrafts(pageCount: number): PageDraft[] {
  return Array.from({ length: pageCount }, (_, i) => ({
    id: crypto.randomUUID(),
    sourceIndex: i,
    rotationDelta: 0,
  }));
}
