export interface PDFItem {
  id: string;
  name: string;
  size: number;
  status: "processing" | "done" | "error";
  file?: File;
  processedBlob?: Blob;
}
