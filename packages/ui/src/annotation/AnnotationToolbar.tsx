import type { AnnotationTool } from "@acrobait/core";
import {
  SelectIcon,
  HighlightIcon,
  PenIcon,
  CommentIcon,
  SignatureIcon,
  ImageIcon,
  TextEditIcon,
  FieldTextIcon,
  FieldCheckboxIcon,
  type IconProps,
} from "../icons/Icon.js";
import styles from "./AnnotationToolbar.module.css";

const GROUPS: { tool: AnnotationTool; label: string; Icon: (props: IconProps) => JSX.Element }[][] = [
  [{ tool: "select", label: "Selecionar", Icon: SelectIcon }],
  [
    { tool: "highlight", label: "Grifar", Icon: HighlightIcon },
    { tool: "freehand", label: "Desenhar", Icon: PenIcon },
    { tool: "comment", label: "Comentar", Icon: CommentIcon },
  ],
  [
    { tool: "signature", label: "Assinar", Icon: SignatureIcon },
    { tool: "image", label: "Imagem", Icon: ImageIcon },
    { tool: "text", label: "Editar texto", Icon: TextEditIcon },
  ],
  [
    { tool: "newTextField", label: "Campo de texto", Icon: FieldTextIcon },
    { tool: "newCheckbox", label: "Caixa de seleção", Icon: FieldCheckboxIcon },
  ],
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
    <div role="toolbar" aria-label="Ferramentas de anotação" className={styles.toolbar}>
      {GROUPS.map((group, i) => (
        <div className={styles.group} key={i}>
          {group.map(({ tool: t, label, Icon }) => (
            <button
              key={t}
              type="button"
              className="btn btn--tool"
              aria-pressed={tool === t}
              onClick={() => onToolChange(t)}
              title={label}
            >
              <Icon size={16} />
              <span className={styles.label}>{label}</span>
            </button>
          ))}
          <div className={styles.divider} aria-hidden="true" />
        </div>
      ))}
      <input
        type="color"
        value={color}
        onChange={(event) => onColorChange(event.target.value)}
        aria-label="Cor da anotação"
        className="swatch"
      />
    </div>
  );
}
