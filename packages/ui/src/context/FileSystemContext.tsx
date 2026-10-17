import { createContext, useContext, type ReactNode } from "react";
import type { FileSystemAdapter } from "@acrobait/core";

const FileSystemContext = createContext<FileSystemAdapter | null>(null);

export function FileSystemProvider({
  adapter,
  children,
}: {
  adapter: FileSystemAdapter;
  children: ReactNode;
}) {
  return <FileSystemContext.Provider value={adapter}>{children}</FileSystemContext.Provider>;
}

export function useFileSystem(): FileSystemAdapter {
  const adapter = useContext(FileSystemContext);
  if (!adapter) {
    throw new Error("useFileSystem must be used within a FileSystemProvider");
  }
  return adapter;
}
