import { ZoomInIcon, ZoomOutIcon } from "../icons/Icon.js";
import styles from "./ZoomControls.module.css";

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const STEP = 0.25;

export function ZoomControls({
  scale,
  onScaleChange,
}: {
  scale: number;
  onScaleChange: (scale: number) => void;
}) {
  return (
    <div role="group" aria-label="Controles de zoom" className={styles.group}>
      <button
        type="button"
        className={styles.button}
        onClick={() => onScaleChange(Math.max(MIN_SCALE, scale - STEP))}
        disabled={scale <= MIN_SCALE}
        aria-label="Diminuir zoom"
      >
        <ZoomOutIcon size={15} />
      </button>
      <span className={styles.value}>{Math.round(scale * 100)}%</span>
      <button
        type="button"
        className={styles.button}
        onClick={() => onScaleChange(Math.min(MAX_SCALE, scale + STEP))}
        disabled={scale >= MAX_SCALE}
        aria-label="Aumentar zoom"
      >
        <ZoomInIcon size={15} />
      </button>
    </div>
  );
}
