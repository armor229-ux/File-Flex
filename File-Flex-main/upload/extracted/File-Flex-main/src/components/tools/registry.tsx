import dynamic from "next/dynamic";
import { Spinner } from "@/components/spinner";

const Loading = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <Spinner label="Loading tool…" />
  </div>
);

/**
 * Maps a tool slug to its lazy-loaded, client-only React component.
 * Each tool is loaded with ssr:false because they use browser-only APIs
 * (pdf-lib, pdf.js, canvas, SubtleCrypto, qpdf-wasm, etc.).
 */
export const toolComponents: Record<string, React.ComponentType> = {
  // PDF (15)
  "pdf-merge": dynamic(() => import("./pdf/pdf-merge").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-split": dynamic(() => import("./pdf/pdf-split").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-compress": dynamic(() => import("./pdf/pdf-compress").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-rotate": dynamic(() => import("./pdf/pdf-rotate").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-reorder": dynamic(() => import("./pdf/pdf-reorder").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-delete-pages": dynamic(() => import("./pdf/pdf-delete-pages").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-to-jpg": dynamic(() => import("./pdf/pdf-to-jpg").then((m) => m.default), { ssr: false, loading: Loading }),
  "jpg-to-pdf": dynamic(() => import("./pdf/jpg-to-pdf").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-extract-text": dynamic(() => import("./pdf/pdf-extract-text").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-password": dynamic(() => import("./pdf/pdf-password").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-unlock": dynamic(() => import("./pdf/pdf-unlock").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-add-watermark": dynamic(() => import("./pdf/pdf-add-watermark").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-add-page-numbers": dynamic(() => import("./pdf/pdf-add-page-numbers").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-edit-metadata": dynamic(() => import("./pdf/pdf-edit-metadata").then((m) => m.default), { ssr: false, loading: Loading }),
  "pdf-extract-images": dynamic(() => import("./pdf/pdf-extract-images").then((m) => m.default), { ssr: false, loading: Loading }),
  // Images (7)
  "image-compress": dynamic(() => import("./images/image-compress").then((m) => m.default), { ssr: false, loading: Loading }),
  "image-resize": dynamic(() => import("./images/image-resize").then((m) => m.default), { ssr: false, loading: Loading }),
  "image-convert": dynamic(() => import("./images/image-convert").then((m) => m.default), { ssr: false, loading: Loading }),
  "heic-to-jpg": dynamic(() => import("./images/heic-to-jpg").then((m) => m.default), { ssr: false, loading: Loading }),
  "image-rotate": dynamic(() => import("./images/image-rotate").then((m) => m.default), { ssr: false, loading: Loading }),
  "image-crop": dynamic(() => import("./images/image-crop").then((m) => m.default), { ssr: false, loading: Loading }),
  "image-add-watermark": dynamic(() => import("./images/image-add-watermark").then((m) => m.default), { ssr: false, loading: Loading }),
  // Office (10)
  "excel-to-csv": dynamic(() => import("./office/excel-to-csv").then((m) => m.default), { ssr: false, loading: Loading }),
  "csv-to-excel": dynamic(() => import("./office/csv-to-excel").then((m) => m.default), { ssr: false, loading: Loading }),
  "excel-to-pdf": dynamic(() => import("./office/excel-to-pdf").then((m) => m.default), { ssr: false, loading: Loading }),
  "docx-preview": dynamic(() => import("./office/docx-preview").then((m) => m.default), { ssr: false, loading: Loading }),
  "text-to-pdf": dynamic(() => import("./office/text-to-pdf").then((m) => m.default), { ssr: false, loading: Loading }),
  "markdown-to-pdf": dynamic(() => import("./office/markdown-to-pdf").then((m) => m.default), { ssr: false, loading: Loading }),
  "json-to-csv": dynamic(() => import("./office/json-to-csv").then((m) => m.default), { ssr: false, loading: Loading }),
  "csv-to-json": dynamic(() => import("./office/csv-to-json").then((m) => m.default), { ssr: false, loading: Loading }),
  "yaml-to-json": dynamic(() => import("./office/yaml-to-json").then((m) => m.default), { ssr: false, loading: Loading }),
  "json-to-yaml": dynamic(() => import("./office/json-to-yaml").then((m) => m.default), { ssr: false, loading: Loading }),
  // Utilities (11)
  "password-generator": dynamic(() => import("./utilities/password-generator").then((m) => m.default), { ssr: false, loading: Loading }),
  "qr-generator": dynamic(() => import("./utilities/qr-generator").then((m) => m.default), { ssr: false, loading: Loading }),
  "qr-reader": dynamic(() => import("./utilities/qr-reader").then((m) => m.default), { ssr: false, loading: Loading }),
  "hash-generator": dynamic(() => import("./utilities/hash").then((m) => m.default), { ssr: false, loading: Loading }),
  "zip-create": dynamic(() => import("./utilities/zip-create").then((m) => m.default), { ssr: false, loading: Loading }),
  "zip-extract": dynamic(() => import("./utilities/zip-extract").then((m) => m.default), { ssr: false, loading: Loading }),
  "file-rename-batch": dynamic(() => import("./utilities/file-rename-batch").then((m) => m.default), { ssr: false, loading: Loading }),
  "text-tools": dynamic(() => import("./utilities/text-tools").then((m) => m.default), { ssr: false, loading: Loading }),
  "color-picker": dynamic(() => import("./utilities/color-picker").then((m) => m.default), { ssr: false, loading: Loading }),
  "base64": dynamic(() => import("./utilities/base64").then((m) => m.default), { ssr: false, loading: Loading }),
  "url-encode-decode": dynamic(() => import("./utilities/url-encode-decode").then((m) => m.default), { ssr: false, loading: Loading }),
  "regex-tester": dynamic(() => import("./utilities/regex-tester").then((m) => m.default), { ssr: false, loading: Loading }),
};

export function getToolComponent(slug: string): React.ComponentType | undefined {
  return toolComponents[slug];
}
