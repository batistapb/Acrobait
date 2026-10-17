import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  getPageTextRuns,
  findTextRunAtPoint,
  isMovableAnnotation,
  type Annotation,
  type AnnotationTool,
  type Point,
  type Rect,
  type TextRun,
  type PdfDocumentHandle,
} from "@acrobait/core";
import styles from "./AnnotationLayer.module.css";

export interface PendingImage {
  dataUrl: string;
  width: number;
  height: number;
}

type DragMode =
  | { kind: "move"; id: string; startPoint: Point; startRect: Rect }
  | { kind: "resize"; id: string; startPoint: Point; startRect: Rect };

function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function AnnotationLayer({
  handle,
  pageIndex,
  scale,
  annotations,
  tool,
  color,
  pendingImage,
  onAddAnnotation,
  onUpdateAnnotation,
}: {
  handle: PdfDocumentHandle;
  pageIndex: number;
  scale: number;
  annotations: Annotation[];
  tool: AnnotationTool;
  color: string;
  pendingImage: PendingImage | null;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, rect: Rect) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);
  const [strokePoints, setStrokePoints] = useState<Point[] | null>(null);
  const [pendingComment, setPendingComment] = useState<{ point: Point; text: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [textRuns, setTextRuns] = useState<TextRun[]>([]);
  const [pendingTextEdit, setPendingTextEdit] = useState<{ run: TextRun; value: string } | null>(
    null,
  );
  const [pendingField, setPendingField] = useState<{
    kind: "newTextField" | "newCheckbox";
    rect: Rect;
    name: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPageTextRuns(handle, pageIndex).then((runs) => {
      if (!cancelled) setTextRuns(runs);
    });
    return () => {
      cancelled = true;
    };
  }, [handle, pageIndex]);

  function toPagePoint(event: { clientX: number; clientY: number }): Point {
    const bounds = overlayRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: (event.clientX - bounds.left) / scale,
      y: (event.clientY - bounds.top) / scale,
    };
  }

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);
  const selectedAnnotation = pageAnnotations.find(
    (a) => a.id === selectedId && isMovableAnnotation(a),
  );

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const point = toPagePoint(event);
    if (tool === "highlight" || tool === "newTextField" || tool === "newCheckbox") {
      setDragStart(point);
      setDragCurrent(point);
    } else if (tool === "freehand") {
      setStrokePoints([point]);
    } else if (tool === "comment" && !pendingComment) {
      setPendingComment({ point, text: "" });
    } else if (tool === "text" && !pendingTextEdit) {
      const run = findTextRunAtPoint(textRuns, point);
      if (run) setPendingTextEdit({ run, value: run.text });
    } else if ((tool === "signature" || tool === "image") && pendingImage) {
      onAddAnnotation({
        id: crypto.randomUUID(),
        type: tool,
        pageIndex,
        rect: { x: point.x, y: point.y, width: pendingImage.width, height: pendingImage.height },
        imageDataUrl: pendingImage.dataUrl,
      });
    } else if (tool === "select") {
      const hit = [...pageAnnotations].reverse().find((a) => isMovableAnnotation(a) && pointInRect(point, a.rect));
      if (hit && isMovableAnnotation(hit)) {
        setSelectedId(hit.id);
        setDragMode({ kind: "move", id: hit.id, startPoint: point, startRect: { ...hit.rect } });
      } else {
        setSelectedId(null);
      }
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if ((tool === "highlight" || tool === "newTextField" || tool === "newCheckbox") && dragStart) {
      setDragCurrent(toPagePoint(event));
    } else if (tool === "freehand" && strokePoints) {
      setStrokePoints([...strokePoints, toPagePoint(event)]);
    } else if (dragMode) {
      const point = toPagePoint(event);
      const dx = point.x - dragMode.startPoint.x;
      const dy = point.y - dragMode.startPoint.y;
      if (dragMode.kind === "move") {
        onUpdateAnnotation(dragMode.id, { ...dragMode.startRect, x: dragMode.startRect.x + dx, y: dragMode.startRect.y + dy });
      } else {
        onUpdateAnnotation(dragMode.id, {
          ...dragMode.startRect,
          width: Math.max(10, dragMode.startRect.width + dx),
          height: Math.max(10, dragMode.startRect.height + dy),
        });
      }
    }
  }

  function handlePointerUp() {
    if ((tool === "highlight" || tool === "newTextField" || tool === "newCheckbox") && dragStart && dragCurrent) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const width = Math.abs(dragCurrent.x - dragStart.x);
      const height = Math.abs(dragCurrent.y - dragStart.y);
      if (width > 2 && height > 2) {
        if (tool === "highlight") {
          onAddAnnotation({ id: crypto.randomUUID(), type: "highlight", pageIndex, rect: { x, y, width, height }, color });
        } else {
          setPendingField({ kind: tool, rect: { x, y, width, height }, name: "" });
        }
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
    setDragMode(null);
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

  function submitNewField() {
    if (!pendingField || !pendingField.name.trim()) {
      setPendingField(null);
      return;
    }
    onAddAnnotation({
      id: crypto.randomUUID(),
      type: pendingField.kind,
      pageIndex,
      rect: pendingField.rect,
      fieldName: pendingField.name.trim(),
    });
    setPendingField(null);
  }

  function submitTextEdit() {
    if (!pendingTextEdit) return;
    onAddAnnotation({
      id: crypto.randomUUID(),
      type: "textEdit",
      pageIndex,
      coverRect: pendingTextEdit.run.rect,
      text: pendingTextEdit.value,
      fontSize: pendingTextEdit.run.fontSize,
    });
    setPendingTextEdit(null);
  }

  return (
    <div
      ref={overlayRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={styles.overlay}
      style={{ cursor: tool === "select" ? "default" : "crosshair" }}
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
        {selectedAnnotation && isMovableAnnotation(selectedAnnotation) && (
          <g>
            <rect
              x={selectedAnnotation.rect.x * scale}
              y={selectedAnnotation.rect.y * scale}
              width={selectedAnnotation.rect.width * scale}
              height={selectedAnnotation.rect.height * scale}
              fill="none"
              stroke="var(--pen-blue, #3456e8)"
              strokeDasharray="4 2"
            />
            <rect
              x={(selectedAnnotation.rect.x + selectedAnnotation.rect.width) * scale - 6}
              y={(selectedAnnotation.rect.y + selectedAnnotation.rect.height) * scale - 6}
              width={12}
              height={12}
              rx={2}
              fill="var(--pen-blue, #3456e8)"
              className={styles.resizeHandle}
              onPointerDown={(event) => {
                event.stopPropagation();
                const point = toPagePoint(event);
                setDragMode({
                  kind: "resize",
                  id: selectedAnnotation.id,
                  startPoint: point,
                  startRect: { ...selectedAnnotation.rect },
                });
              }}
            />
          </g>
        )}
      </svg>
      {pendingComment && (
        <div
          onPointerDown={(event) => event.stopPropagation()}
          className={`${styles.popover} panel`}
          style={{ left: pendingComment.point.x * scale, top: pendingComment.point.y * scale }}
        >
          <textarea
            autoFocus
            rows={3}
            value={pendingComment.text}
            onChange={(event) => setPendingComment({ ...pendingComment, text: event.target.value })}
            className={`${styles.popoverInput} fieldInput`}
          />
          <div className={styles.popoverActions}>
            <button type="button" className="btn btn--subtle" onClick={() => setPendingComment(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn--primary" onClick={submitComment}>
              Adicionar
            </button>
          </div>
        </div>
      )}
      {pendingTextEdit && (
        <div
          onPointerDown={(event) => event.stopPropagation()}
          className={`${styles.popover} panel`}
          style={{
            left: pendingTextEdit.run.rect.x * scale,
            top: (pendingTextEdit.run.rect.y + pendingTextEdit.run.rect.height + 4) * scale,
          }}
        >
          <input
            autoFocus
            value={pendingTextEdit.value}
            onChange={(event) => setPendingTextEdit({ ...pendingTextEdit, value: event.target.value })}
            className={`${styles.popoverInput} fieldInput`}
          />
          <div className={styles.popoverActions}>
            <button type="button" className="btn btn--subtle" onClick={() => setPendingTextEdit(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn--primary" onClick={submitTextEdit}>
              Aplicar
            </button>
          </div>
        </div>
      )}
      {pendingField && (
        <div
          onPointerDown={(event) => event.stopPropagation()}
          className={`${styles.popover} panel`}
          style={{
            left: pendingField.rect.x * scale,
            top: (pendingField.rect.y + pendingField.rect.height + 4) * scale,
          }}
        >
          <input
            autoFocus
            placeholder="Nome do campo"
            value={pendingField.name}
            onChange={(event) => setPendingField({ ...pendingField, name: event.target.value })}
            className={`${styles.popoverInput} fieldInput`}
          />
          <div className={styles.popoverActions}>
            <button type="button" className="btn btn--subtle" onClick={() => setPendingField(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn--primary" onClick={submitNewField}>
              Criar campo
            </button>
          </div>
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
          fill="var(--mark-yellow, #ffcb3d)"
          stroke="var(--ink-700, #343b46)"
          strokeWidth={1}
        >
          <title>{annotation.text}</title>
        </circle>
      );
    case "signature":
    case "image":
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
    case "textEdit":
      return (
        <g key={annotation.id}>
          <rect
            x={annotation.coverRect.x * scale}
            y={annotation.coverRect.y * scale}
            width={annotation.coverRect.width * scale}
            height={annotation.coverRect.height * scale}
            fill="var(--paper, #fdfcfa)"
          />
          <text
            x={annotation.coverRect.x * scale}
            y={(annotation.coverRect.y + annotation.coverRect.height * 0.85) * scale}
            fontSize={annotation.fontSize * scale}
            fill="var(--ink-900, #1c2128)"
          >
            {annotation.text}
          </text>
        </g>
      );
    case "newTextField":
    case "newCheckbox":
      return (
        <g key={annotation.id}>
          <rect
            x={annotation.rect.x * scale}
            y={annotation.rect.y * scale}
            width={annotation.rect.width * scale}
            height={annotation.rect.height * scale}
            fill="var(--pen-blue-wash, #eaefff)"
            stroke="var(--pen-blue, #3456e8)"
            strokeDasharray="4 2"
          />
          <text
            x={annotation.rect.x * scale + 4}
            y={annotation.rect.y * scale - 4}
            fontSize={11}
            fontFamily="var(--font-mono, monospace)"
            fill="var(--pen-blue, #3456e8)"
          >
            {annotation.fieldName}
          </text>
        </g>
      );
    default:
      return null;
  }
}
