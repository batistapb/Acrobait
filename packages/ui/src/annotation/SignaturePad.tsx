import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./SignaturePad.module.css";

const PAD_WIDTH = 320;
const PAD_HEIGHT = 120;

export function SignaturePad({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  function getPos(event: ReactPointerEvent<HTMLCanvasElement>) {
    const bounds = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(event);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  }

  function handlePointerUp() {
    setIsDrawing(false);
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    }
  }

  function handleUse() {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    onCapture(canvas.toDataURL("image/png"));
  }

  return (
    <div className={styles.panel}>
      <canvas
        ref={canvasRef}
        width={PAD_WIDTH}
        height={PAD_HEIGHT}
        className={styles.canvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div className={styles.actions}>
        <button type="button" className="btn btn--subtle" onClick={handleClear}>
          Limpar
        </button>
        <button type="button" className="btn btn--primary" onClick={handleUse} disabled={isEmpty}>
          Usar assinatura
        </button>
      </div>
    </div>
  );
}
