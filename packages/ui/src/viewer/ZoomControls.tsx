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
    <div role="group" aria-label="Controles de zoom">
      <button
        type="button"
        onClick={() => onScaleChange(Math.max(MIN_SCALE, scale - STEP))}
        disabled={scale <= MIN_SCALE}
      >
        −
      </button>
      <span>{Math.round(scale * 100)}%</span>
      <button
        type="button"
        onClick={() => onScaleChange(Math.min(MAX_SCALE, scale + STEP))}
        disabled={scale >= MAX_SCALE}
      >
        +
      </button>
    </div>
  );
}
