import type { PdfDocumentHandle } from "@acrobait/core";
import { PdfCanvasViewer } from "./PdfCanvasViewer.js";
import styles from "./ThumbnailSidebar.module.css";

const THUMBNAIL_SCALE = 0.2;

export function ThumbnailSidebar({
  handle,
  currentPage,
  onSelectPage,
}: {
  handle: PdfDocumentHandle;
  currentPage: number;
  onSelectPage: (pageIndex: number) => void;
}) {
  const pageIndices = Array.from({ length: handle.pageCount }, (_, i) => i);

  return (
    <aside aria-label="Miniaturas de página" className={styles.aside}>
      {pageIndices.map((pageIndex) => (
        <button
          key={pageIndex}
          type="button"
          aria-current={pageIndex === currentPage}
          onClick={() => onSelectPage(pageIndex)}
          className={styles.item}
        >
          <span className={styles.thumb}>
            <PdfCanvasViewer handle={handle} pageIndex={pageIndex} scale={THUMBNAIL_SCALE} />
          </span>
          <span className={styles.number}>{pageIndex + 1}</span>
        </button>
      ))}
    </aside>
  );
}
