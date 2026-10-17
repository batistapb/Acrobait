import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PageDraft, PdfDocumentHandle } from "@acrobait/core";
import { PdfCanvasViewer } from "../viewer/PdfCanvasViewer.js";

const THUMB_SCALE = 0.3;

function SortablePageThumbnail({
  draft,
  handle,
  displayIndex,
  onRotate,
  onDelete,
}: {
  draft: PageDraft;
  handle: PdfDocumentHandle;
  displayIndex: number;
  onRotate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: draft.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ transform: `rotate(${draft.rotationDelta}deg)` }}>
        <PdfCanvasViewer handle={handle} pageIndex={draft.sourceIndex} scale={THUMB_SCALE} />
      </div>
      <span>{displayIndex + 1}</span>
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onRotate}
      >
        Girar
      </button>
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onDelete}
      >
        Excluir
      </button>
    </div>
  );
}

type PagesUpdater = PageDraft[] | ((prev: PageDraft[]) => PageDraft[]);

export function PageOrganizerGrid({
  handle,
  pages,
  onPagesChange,
}: {
  handle: PdfDocumentHandle;
  pages: PageDraft[];
  onPagesChange: (update: PagesUpdater) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Each handler updates via a function of the *previous* state rather than the
  // `pages` prop snapshot, so rapid/batched calls (e.g. two clicks in the same
  // React update) compose instead of one silently clobbering the other.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onPagesChange((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleRotate(id: string) {
    onPagesChange((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, rotationDelta: (((p.rotationDelta + 90) % 360) as 0 | 90 | 180 | 270) }
          : p,
      ),
    );
  }

  function handleDelete(id: string) {
    onPagesChange((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: 12,
          }}
        >
          {pages.map((draft, displayIndex) => (
            <SortablePageThumbnail
              key={draft.id}
              draft={draft}
              handle={handle}
              displayIndex={displayIndex}
              onRotate={() => handleRotate(draft.id)}
              onDelete={() => handleDelete(draft.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
