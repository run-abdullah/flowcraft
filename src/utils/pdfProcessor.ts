import { invoke } from '@tauri-apps/api/core'; // Tauri v2 command invoker
import type { PDFItem } from "./types/pdf";

// Yahan PDFItem pass karke file ko Rust backend mein bhejain ge
const processPDF = async (item: PDFItem) => {
  if (!item.file) return;

  try {
    // File ko bytes mein convert karo
    const arrayBuffer = await item.file.arrayBuffer();
    const inputBytes = new Uint8Array(arrayBuffer);

    // Rust function call (Super fast, microseconds lagain ge)
    const modifiedBytes = await invoke<number[]>('process_ticket_pdf', {
        inputBytes: Array.from(inputBytes)
    });

    // Wapis aaye hue modified bytes ko Blob banalo
    const blob = new Blob([new Uint8Array(modifiedBytes)], { type: "application/pdf" });

    setProcessing((prev) => prev.filter((p) => p.id !== item.id));
    setCompleted((prev) => [
      { ...item, status: "done", processedBlob: blob },
      ...prev,
    ]);
  } catch (error) {
    console.error("Rust PDF processing failed:", error);
    setProcessing((prev) => prev.filter((p) => p.id !== item.id));
    setCompleted((prev) => [{ ...item, status: "error" }, ...prev]);
  }
};
