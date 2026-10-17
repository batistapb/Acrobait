import { useEffect, useRef } from "react";
import { renderPageToCanvas, type PdfDocumentHandle } from "@acrobait/core";

export function PdfCanvasViewer({
  handle,
  pageIndex,
  scale,
}: {
  handle: PdfDocumentHandle;
  pageIndex: number;
  scale: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    renderPageToCanvas(handle, pageIndex, canvas, scale).catch((error: unknown) => {
      if (!cancelled) console.error("Falha ao renderizar página do PDF", error);
    });
    return () => {
      cancelled = true;
    };
  }, [handle, pageIndex, scale]);

  return <canvas ref={canvasRef} />;
}
