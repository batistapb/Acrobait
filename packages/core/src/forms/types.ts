import type { Rect } from "../engine/types.js";

export type FormFieldType = "text" | "checkbox" | "radio" | "dropdown";

export interface FormField {
  name: string;
  type: FormFieldType;
  pageIndex: number;
  rect: Rect;
  value: string;
  checked?: boolean;
  options?: string[];
}

export type FormFieldValues = Record<string, string | boolean>;
