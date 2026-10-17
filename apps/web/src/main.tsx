import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { configureWorker } from "@acrobait/core";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@acrobait/ui/src/styles/global.css";
import { App } from "./App.js";

configureWorker(pdfWorkerUrl);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
