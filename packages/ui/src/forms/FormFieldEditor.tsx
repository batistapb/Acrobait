import { useEffect, useState, type CSSProperties } from "react";
import {
  getPageFormFields,
  type FormField,
  type FormFieldValues,
  type PdfDocumentHandle,
} from "@acrobait/core";

type ValuesUpdater = FormFieldValues | ((prev: FormFieldValues) => FormFieldValues);

export function FormFieldEditor({
  handle,
  pageIndex,
  scale,
  values,
  onValuesChange,
}: {
  handle: PdfDocumentHandle;
  pageIndex: number;
  scale: number;
  values: FormFieldValues;
  onValuesChange: (update: ValuesUpdater) => void;
}) {
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    let cancelled = false;
    getPageFormFields(handle, pageIndex).then((loaded) => {
      if (cancelled) return;
      setFields(loaded);
      // Seed any field the user hasn't touched yet with its current PDF value.
      onValuesChange((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const field of loaded) {
          if (!(field.name in next)) {
            next[field.name] = field.type === "checkbox" ? !!field.checked : field.value;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [handle, pageIndex, onValuesChange]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {fields.map((field) => {
        const style: CSSProperties = {
          position: "absolute",
          left: field.rect.x * scale,
          top: field.rect.y * scale,
          width: field.rect.width * scale,
          height: field.rect.height * scale,
        };
        const value = values[field.name];

        if (field.type === "text") {
          return (
            <input
              key={field.name}
              type="text"
              className="fieldInput"
              value={typeof value === "string" ? value : field.value}
              onChange={(event) =>
                onValuesChange((prev) => ({ ...prev, [field.name]: event.target.value }))
              }
              style={style}
            />
          );
        }

        if (field.type === "checkbox") {
          return (
            <input
              key={field.name}
              type="checkbox"
              checked={typeof value === "boolean" ? value : !!field.checked}
              onChange={(event) =>
                onValuesChange((prev) => ({ ...prev, [field.name]: event.target.checked }))
              }
              style={{ ...style, accentColor: "var(--pen-blue)" }}
            />
          );
        }

        if (field.type === "dropdown") {
          return (
            <select
              key={field.name}
              className="fieldInput"
              value={typeof value === "string" ? value : field.value}
              onChange={(event) =>
                onValuesChange((prev) => ({ ...prev, [field.name]: event.target.value }))
              }
              style={style}
            >
              {(field.options ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }

        // Radio groups: v1 shows the current selection read-only. Editing them
        // needs each widget's own export value, which pdf.js's getAnnotations()
        // doesn't expose per-widget in a way readFields.ts currently captures.
        return (
          <div
            key={field.name}
            style={{
              ...style,
              border: "1px dashed var(--paper-line-strong)",
              borderRadius: "var(--radius-sm)",
              fontSize: 11,
              color: "var(--ink-600)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              paddingLeft: 6,
            }}
          >
            {field.value || "(somente leitura)"}
          </div>
        );
      })}
    </div>
  );
}
