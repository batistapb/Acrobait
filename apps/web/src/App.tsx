import { useMemo } from "react";
import { AcrobaitApp } from "@acrobait/ui";
import { WebFileSystemAdapter } from "./adapters/WebFileSystemAdapter.js";

export function App() {
  const adapter = useMemo(() => new WebFileSystemAdapter(), []);
  return <AcrobaitApp adapter={adapter} />;
}
