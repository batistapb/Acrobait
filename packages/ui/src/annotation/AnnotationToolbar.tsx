import type { AnnotationTool } from "@acrobait/core";

const TOOLS: { tool: AnnotationTool; label: string }[] = [
  { tool: "select", label: "Selecionar" },
  { tool: "highlight", label: "Grifar" },
  { tool: "freehand", label: "Desenhar" },
  { tool: "comment", label: "Comentar" },
  { tool: "signature", label: "Assinar" },
  { tool: "image", label: "Inserir imagem" },
  { tool: "text", label: "Editar texto" },
];

export function AnnotationToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
}: {
  tool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  color: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <div role="toolbar" aria-label="Ferramentas de anotação">
      {TOOLS.map(({ tool: t, label }) => (
        <button key={t} type="button" aria-pressed={tool === t} onClick={() => onToolChange(t)}>
          {label}
        </button>
      ))}
      <input
        type="color"
        value={color}
        onChange={(event) => onColorChange(event.target.value)}
        aria-label="Cor da anotação"
      />
    </div>
  );
}
