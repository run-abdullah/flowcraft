import { invoke } from "@tauri-apps/api/core";
import { createSignal } from "solid-js";
import CompletedList from "./components/CompletedList";
import DropZone from "./components/DropZone";
import Header from "./components/Header";
import ProcessingList from "./components/ProcessingList";
import type { PDFItem } from "./types/pdf";

function App() {
  const [processing, setProcessing] = createSignal<PDFItem[]>([]);
  const [completed, setCompleted] = createSignal<PDFItem[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");

    const newItems: PDFItem[] = pdfs.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: "processing",
      file,
    }));

    setProcessing((prev) => [...prev, ...newItems]);
    newItems.forEach(processPDF);
  };

  const processPDF = async (item: PDFItem) => {
    if (!item.file) return;

    try {
      const arrayBuffer = await item.file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const modifiedBytes = await invoke<number[]>("process_ticket_pdf", {
        inputBytes: Array.from(uint8Array),
      });

      const blob = new Blob([new Uint8Array(modifiedBytes)], {
        type: "application/pdf",
      });

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

  const downloadPDF = async (item: PDFItem) => {
    if (!item.processedBlob) return;

    try {
      const suggestedName = item.name;
      const arrayBuffer = await item.processedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Rust native file dialog call
      await invoke("save_pdf_file", {
        defaultName: suggestedName,
        fileBytes: Array.from(uint8Array),
      });
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  };

  return (
    <main class="relative z-10 min-h-screen p-6 lg:p-8">
      <div class="max-w-6xl mx-auto">
        <Header />
        <div class="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5">
          <section class="flex flex-col gap-4">
            <DropZone onFiles={handleFiles} />
            <ProcessingList items={processing()} />
          </section>
          <section>
            <CompletedList
              items={completed()}
              onDownload={downloadPDF}
              onClear={() => setCompleted([])}
            />
          </section>
        </div>
        <footer class="mt-12 text-center">
          <p class="text-[11px] text-emerald-200/40 font-medium tracking-wide">
            ✨ Pure Native Tauri System Setup ✨
          </p>
        </footer>
      </div>
    </main>
  );
}

export default App;
