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
    // Wails Native Drag Drop Listener
    OnFileDrop((x: number, y: number, paths: string[]) => {
      console.log("=== [Native Drop Event Triggered] ===");
      console.log("X/Y Coords:", x, y);
      console.log("Dropped Paths Array:", paths);

      if (!paths || paths.length === 0) {
        console.warn("No paths received from native drag!");
        return;
      }

      const pdfPaths = paths.filter((p) => p.toLowerCase().endsWith(".pdf"));
      console.log("Filtered PDF Paths:", pdfPaths);

      pdfPaths.forEach((path) => {
        // Windows (\) aur Linux (/) path clean handling
        const fileName = path.split(/[/\\]/).pop() || "ticket.pdf";
        const id = crypto.randomUUID();
        console.log(`Processing File -> Name: ${fileName} | Path: ${path}`);
        processPath(id, fileName, path);
      });
    }, true);
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
      <main class="h-screen w-screen bg-app-bg text-text-main p-6 font-sans flex flex-col overflow-hidden select-none">
        <div class="max-w-6xl w-full mx-auto flex flex-col h-full gap-6">
          {/* Header - Fixed Height */}
          <div class="shrink-0">
            <Header />
          </div>

          {/* Desktop Split View - Fixed Height Fill */}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
            {/* Left Panel: DropZone + Active Processing List */}
            <section class="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
              <div class="shrink-0">
                <DropZone onSelectClick={handleSelectFiles} />
              </div>

              {/* Processing list scrolls independently if items overflow */}
              <div class="flex-1 overflow-y-auto min-h-0 pr-1">
                <ProcessingList items={processing()} />
              </div>
            </section>

            {/* Right Panel: Completed Items Panel */}
            <section class="h-full min-h-0 overflow-hidden">
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
