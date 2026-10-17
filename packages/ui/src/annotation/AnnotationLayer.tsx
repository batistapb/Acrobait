import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Annotation, AnnotationTool, Point } from "@acrobait/core";

const DEFAULT_SIGNATURE_WIDTH = 160;
const DEFAULT_SIGNATURE_HEIGHT = 60;

export function AnnotationLayer({
  pageIndex,
  scale,
  annotations,
  tool,
  color,
  pendingSignature,
  onAddAnnotation,
}: {
  pageIndex: number;
  scale: number;
  annotations: Annotation[];
  tool: AnnotationTool;
  color: string;
  pendingSignature: string | null;
  onAddAnnotation: (annotation: Annotation) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);
  const [strokePoints, setStrokePoints] = useState<Point[] | null>(null);
  const [pendingComment, setPendingComment] = useState<{ point: Point; text: string } | null>(null);

  function toPagePoint(event: ReactPointerEvent<HTMLDivElement>): Point {
    const bounds = overlayRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: (event.clientX - bounds.left) / scale,
      y: (event.clientY - bounds.top) / scale,
    };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const point = toPagePoint(event);
    if (tool === "highlight") {
      setDragStart(point);
      setDragCurrent(point);
    } else if (tool === "freehand") {
      setStrokePoints([point]);
    } else if (tool === "comment" && !pendingComment) {
      setPendingComment({ point, text: "" });
    } else if (tool === "signature" && pendingSignature) {
      onAddAnnotation({
        id: crypto.randomUUID(),
        type: "signature",
        pageIndex,
        rect: {
          x: point.x,
          y: point.y,
          width: DEFAULT_SIGNATURE_WIDTH,
          height: DEFAULT_SIGNATURE_HEIGHT,
        },
        imageDataUrl: pendingSignature,
      });
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (tool === "highlight" && dragStart) {
      setDragCurrent(toPagePoint(event));
    } else if (tool === "freehand" && strokePoints) {
      setStrokePoints([...strokePoints, toPagePoint(event)]);
    }
  }

  function handlePointerUp() {
    if (tool === "highlight" && dragStart && dragCurrent) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const width = Math.abs(dragCurrent.x - dragStart.x);
      const height = Math.abs(dragCurrent.y - dragStart.y);
      if (width > 2 && height > 2) {
        onAddAnnotation({ id: crypto.randomUUID(), type: "highlight", pageIndex, rect: { x, y, width, height }, color });
      }
      setDragStart(null);
      setDragCurrent(null);
    } else if (tool === "freehand" && strokePoints) {
      if (strokePoints.length > 1) {
        onAddAnnotation({
          id: crypto.randomUUID(),
          type: "freehand",
          pageIndex,
          points: strokePoints,
          color,
          strokeWidth: 2,
        });
      }
      setStrokePoints(null);
    }
  }

  function submitComment() {
    if (!pendingComment || !pendingComment.text.trim()) {
      setPendingComment(null);
      return;
    }
    onAddAnnotation({
      id: crypto.randomUUID(),
      type: "comment",
      pageIndex,
      position: pendingComment.point,
      text: pendingComment.text.trim(),
    });
    setPendingComment(null);
  }

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);

  return (
    <div
      ref={overlayRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "absolute",
        inset: 0,
        cursor: tool === "select" ? "default" : "crosshair",
        pointerEvents: tool === "select" ? "none" : "auto",
        touchAction: "none",
      }}
    >
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {pageAnnotations.map((annotation) => renderAnnotation(annotation, scale))}
        {dragStart && dragCurrent && (
          <rect
            x={Math.min(dragStart.x, dragCurrent.x) * scale}
            y={Math.min(dragStart.y, dragCurrent.y) * scale}
            width={Math.abs(dragCurrent.x - dragStart.x) * scale}
            height={Math.abs(dragCurrent.y - dragStart.y) * scale}
            fill={color}
            opacity={0.35}
          />
        )}
        {strokePoints && strokePoints.length > 1 && (
          <polyline
            points={strokePoints.map((p) => `${p.x * scale},${p.y * scale}`).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        )}
      </svg>
      {pendingComment && (
        <div
          onPointerDown={(event) => event.stopPropagation()}
          style={{
            position: "absolute",
            left: pendingComment.point.x * scale,
            top: pendingComment.point.y * scale,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <textarea
            autoFocus
            rows={3}
            value={pendingComment.text}
            onChange={(event) =>
              setPendingComment({ ...pendingComment, text: event.target.value })
            }
            style={{ display: "block", marginBottom: 4 }}
          />
          <button type="button" onClick={submitComment}>
            Adicionar
          </button>
          <button type="button" onClick={() => setPendingComment(null)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function renderAnnotation(annotation: Annotation, scale: number) {
  switch (annotation.type) {
    case "highlight":
      return (
        <rect
          key={annotation.id}
          x={annotation.rect.x * scale}
          y={annotation.rect.y * scale}
          width={annotation.rect.width * scale}
          height={annotation.rect.height * scale}
          fill={annotation.color}
          opacity={0.35}
        />
      );
    case "freehand":
      return (
        <polyline
          key={annotation.id}
          points={annotation.points.map((p) => `${p.x * scale},${p.y * scale}`).join(" ")}
          fill="none"
          stroke={annotation.color}
          strokeWidth={annotation.strokeWidth}
        />
      );
    case "comment":
      return (
        <circle
          key={annotation.id}
          cx={annotation.position.x * scale}
          cy={annotation.position.y * scale}
          r={6}
          fill="#ffd93d"
          stroke="#b38f00"
        >
          <title>{annotation.text}</title>
        </circle>
      );
    case "signature":
      return (
        <image
          key={annotation.id}
          href={annotation.imageDataUrl}
          x={annotation.rect.x * scale}
          y={annotation.rect.y * scale}
          width={annotation.rect.width * scale}
          height={annotation.rect.height * scale}
        />
      );
    default:
      return null;
  }
}
