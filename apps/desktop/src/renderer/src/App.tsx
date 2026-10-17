import { useMemo } from "react";
import { AcrobaitApp } from "@acrobait/ui";
import { ElectronFileSystemAdapter } from "./adapters/ElectronFileSystemAdapter.js";

export function App() {
  const adapter = useMemo(() => new ElectronFileSystemAdapter(), []);
  return <AcrobaitApp adapter={adapter} />;
}
