import { createSignal, onMount, onCleanup } from "solid-js";
import {
  CopyPDFToClipboard,
  OpenFilePicker,
  ProcessPDFFromPath,
  SavePDFFile,
} from "../wailsjs/go/main/App";
import { OnFileDrop, OnFileDropOff } from "../wailsjs/runtime/runtime";
import CompletedList from "./components/CompletedList";
import DropZone from "./components/DropZone";
import Header from "./components/Header";
import ProcessingList from "./components/ProcessingList";
import type { PDFItem } from "./types/pdf";

function App() {
  const [processing, setProcessing] = createSignal<PDFItem[]>([]);
  const [completed, setCompleted] = createSignal<PDFItem[]>([]);

  onMount(() => {
    // Wails JS Official Runtime Listener
    OnFileDrop((x: number, y: number, paths: string[]) => {
      console.log(
        `[Wails Native Drop] Coordinates: (${x}, ${y}) | Paths:`,
        paths,
      );

      const pdfPaths = paths.filter((p) => p.toLowerCase().endsWith(".pdf"));
      pdfPaths.forEach((path) => {
        const fileName = path.split("/").pop() || "ticket.pdf";
        const id = crypto.randomUUID();
        processPath(id, fileName, path);
      });
    }, true); // <--- Important: useDropTarget = true
  });

  onCleanup(() => {
    OnFileDropOff();
  });

  const processPath = async (id: string, name: string, path: string) => {
    const newItem: PDFItem = {
      id,
      name,
      size: 0,
      status: "processing",
    };

    setProcessing((prev) => [...prev, newItem]);

    try {
      // Go backend direct native path se file read karke python run karta hai
      await ProcessPDFFromPath(id, path);

      setProcessing((prev) => prev.filter((p) => p.id !== id));
      setCompleted((prev) => [{ ...newItem, status: "done" }, ...prev]);
    } catch (error) {
      console.error("PDF Processing Error:", error);
      setProcessing((prev) => prev.filter((p) => p.id !== id));
      setCompleted((prev) => [{ ...newItem, status: "error" }, ...prev]);
    }
  };

  const handleSelectFiles = async () => {
    try {
      const selectedFiles = await OpenFilePicker();
      if (!selectedFiles || selectedFiles.length === 0) return;

      for (const file of selectedFiles) {
        processPath(file.id, file.name, file.path);
      }
    } catch (err) {
      console.error("File selection error:", err);
    }
  };

  const downloadPDF = async (item: PDFItem) => {
    try {
      await SavePDFFile(item.id, item.name);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const copyPDF = async (item: PDFItem) => {
    try {
      const ok = await CopyPDFToClipboard(item.id, item.name);
      if (!ok) {
        console.warn("Copy returned false for", item.name);
      } else {
        console.log("Copied to clipboard:", item.name);
      }
    } catch (error) {
      console.error("Copy error:", error);
    }
  };
  return (
    <main class="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-10 font-sans">
      <div class="max-w-5xl mx-auto">
        <Header />

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section class="space-y-4">
            <DropZone onSelectClick={handleSelectFiles} />
            <ProcessingList items={processing()} />
          </section>

          <section>
            <CompletedList
              items={completed()}
              onDownload={downloadPDF}
              onCopy={copyPDF}
              onClear={() => setCompleted([])}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
