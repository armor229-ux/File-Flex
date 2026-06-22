import {
  FilePlus2,
  Scissors,
  FileArchive,
  Images,
  FileImage,
  RotateCw,
  FileX2,
  ListOrdered,
  Lock,
  Unlock,
  ScanText,
  Stamp,
  Hash,
  ImagePlus,
  Minimize2,
  Scaling,
  RefreshCw,
  ImageDown,
  Crop,
  FileSpreadsheet,
  Table,
  FileSearch,
  FileOutput,
  FileCode,
  Braces,
  FileJson,
  Shuffle,
  QrCode,
  ScanLine,
  Fingerprint,
  FolderArchive,
  FolderInput,
  FolderOutput,
  PencilLine,
  CaseSensitive,
  Pipette,
  Binary,
  Link,
  Regex,
  KeyRound,
  FileCog,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "PDF" | "Images" | "Office" | "Utilities";

export type ToolInputType =
  | "pdf"
  | "multi-pdf"
  | "image"
  | "multi-image"
  | "multi-file"
  | "text"
  | "none";

export interface Tool {
  slug: string;
  name: string;
  short: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  keywords: string[];
  inputType: ToolInputType;
  note?: string;
  accent: string;
  popular?: boolean;
  featured?: boolean;
  status: "stable";
}

export const categoryOrder: ToolCategory[] = ["PDF", "Images", "Office", "Utilities"];

export const categoryLabels: Record<ToolCategory, string> = {
  PDF: "PDF Tools",
  Images: "Image Tools",
  Office: "Office Tools",
  Utilities: "Utilities",
};

export const tools: Tool[] = [
  // ---------------- PDF (15) ----------------
  {
    slug: "pdf-merge",
    name: "Merge PDF",
    short: "Combine multiple PDFs into one file.",
    description:
      "Merge two or more PDF files into a single document, in the order you choose. Everything is processed locally in your browser — your files never leave your device.",
    category: "PDF",
    icon: FilePlus2,
    keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger"],
    inputType: "multi-pdf",
    note: "Output order matches the list below — drag to reorder before merging.",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    popular: true,
    featured: true,
    status: "stable",
  },
  {
    slug: "pdf-split",
    name: "Split PDF",
    short: "Split a PDF into pages or ranges.",
    description:
      "Split a PDF into single pages or by custom page ranges. Runs entirely in your browser; nothing is uploaded.",
    category: "PDF",
    icon: Scissors,
    keywords: ["split pdf", "pdf splitter", "divide pdf", "extract pages"],
    inputType: "pdf",
    note: "Ranges use 1-based indexing, e.g. 1-3,5,8-10. Each range becomes one file.",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    featured: true,
    status: "stable",
  },
  {
    slug: "pdf-compress",
    name: "Compress PDF",
    short: "Reduce PDF size by downsampling images.",
    description:
      "Compress a PDF by re-rendering embedded raster images at a lower resolution and JPEG quality. Client-side with pdf-lib.",
    category: "PDF",
    icon: FileArchive,
    keywords: ["compress pdf", "reduce pdf size", "optimize pdf", "shrink pdf"],
    inputType: "pdf",
    note: "Compression works by downsampling images. Text-heavy PDFs may shrink little; vector-only PDFs may not shrink at all.",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    featured: true,
    status: "stable",
  },
  {
    slug: "pdf-rotate",
    name: "Rotate PDF",
    short: "Rotate all pages of a PDF.",
    description:
      "Rotate every page of a PDF by 90°, 180° or 270°. Processed locally with pdf-lib.",
    category: "PDF",
    icon: RotateCw,
    keywords: ["rotate pdf", "pdf rotator", "turn pdf pages", "rotate pdf 90"],
    inputType: "pdf",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    status: "stable",
  },
  {
    slug: "pdf-reorder",
    name: "Reorder PDF",
    short: "Drag-and-drop to rearrange PDF pages.",
    description:
      "Reorder the pages of a PDF with drag-and-drop, then export a new copy. Fully client-side.",
    category: "PDF",
    icon: ListOrdered,
    keywords: ["reorder pdf", "rearrange pdf pages", "pdf page order"],
    inputType: "pdf",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    status: "stable",
  },
  {
    slug: "pdf-delete-pages",
    name: "Delete PDF Pages",
    short: "Remove unwanted pages from a PDF.",
    description:
      "Delete specific pages from a PDF by listing the page numbers to remove. Runs entirely in your browser.",
    category: "PDF",
    icon: FileX2,
    keywords: ["delete pdf pages", "remove pdf pages", "pdf page remover"],
    inputType: "pdf",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    status: "stable",
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    short: "Convert each PDF page to JPG/PNG.",
    description:
      "Render every page of a PDF to a high-resolution JPG or PNG image and download them as a ZIP. Powered by pdf.js, fully in-browser.",
    category: "PDF",
    icon: Images,
    keywords: ["pdf to jpg", "pdf to png", "pdf to image", "convert pdf"],
    inputType: "pdf",
    note: "Large PDFs take longer to render page-by-page on your device.",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    featured: true,
    status: "stable",
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    short: "Turn images (JPG, PNG, WebP) into a PDF.",
    description:
      "Combine JPG, PNG or WebP images into a single PDF. Reorder pages, then export. 100% client-side.",
    category: "PDF",
    icon: FileImage,
    keywords: ["jpg to pdf", "image to pdf", "png to pdf", "photos to pdf"],
    inputType: "multi-image",
    note: "Each image becomes one page sized to the image dimensions.",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    featured: true,
    status: "stable",
  },
  {
    slug: "pdf-extract-text",
    name: "Extract Text from PDF",
    short: "Copy out the text content of a PDF.",
    description:
      "Extract selectable text from a PDF using pdf.js. Best with text-based PDFs; scanned/image-only PDFs need OCR which is not included.",
    category: "PDF",
    icon: ScanText,
    keywords: ["extract text pdf", "pdf to text", "copy text from pdf", "pdf text"],
    inputType: "pdf",
    note: "Works on text-based PDFs. Scanned/image-only PDFs have no embedded text to extract (no OCR).",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    status: "stable",
  },
  {
    slug: "pdf-password",
    name: "PDF Password",
    short: "Add real AES-256 password protection.",
    description:
      "Add a real AES-256 password to your PDF. Files stay in your browser. The encrypted file requires the password to open in any PDF reader (Chrome, Acrobat, Preview).",
    category: "PDF",
    icon: Lock,
    keywords: ["pdf password", "protect pdf", "encrypt pdf", "secure pdf", "aes-256 pdf"],
    inputType: "pdf",
    note: "Uses qpdf (compiled to WebAssembly) for real AES-256 encryption — the output truly requires the password to open. Tested in Chrome PDF viewer, Adobe Acrobat, and Preview.",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    featured: true,
    status: "stable",
  },
  {
    slug: "pdf-unlock",
    name: "PDF Unlock",
    short: "Remove a password you already know.",
    description:
      "Remove the password from a protected PDF using qpdf-wasm. You must already know the password — we never bypass encryption. Files stay in your browser.",
    category: "PDF",
    icon: Unlock,
    keywords: ["pdf unlock", "remove pdf password", "decrypt pdf", "pdf password remover"],
    inputType: "pdf",
    note: "We never bypass passwords. You must know the password to remove it.",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    status: "stable",
  },
  {
    slug: "pdf-add-watermark",
    name: "PDF Watermark",
    short: "Stamp a text watermark on every page.",
    description:
      "Add a custom text watermark (e.g. CONFIDENTIAL, DRAFT) to every page of a PDF. Choose opacity, angle and size. Client-side with pdf-lib.",
    category: "PDF",
    icon: Stamp,
    keywords: ["pdf watermark", "stamp pdf", "watermark pdf", "add watermark pdf"],
    inputType: "pdf",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    status: "stable",
  },
  {
    slug: "pdf-add-page-numbers",
    name: "PDF Page Numbers",
    short: "Add page numbers to a PDF.",
    description:
      "Insert page numbers into a PDF at the position and format you choose (bottom-center, bottom-right, etc.). Runs in your browser with pdf-lib.",
    category: "PDF",
    icon: Hash,
    keywords: ["pdf page numbers", "number pdf pages", "add page numbers pdf"],
    inputType: "pdf",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    status: "stable",
  },
  {
    slug: "pdf-edit-metadata",
    name: "PDF Metadata",
    short: "Edit title, author, subject, keywords.",
    description:
      "View and edit a PDF's metadata (title, author, subject, keywords, creator, producer). Client-side with pdf-lib.",
    category: "PDF",
    icon: FileCog,
    keywords: ["pdf metadata", "edit pdf metadata", "pdf title author", "pdf info"],
    inputType: "pdf",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    status: "stable",
  },
  {
    slug: "pdf-extract-images",
    name: "Extract PDF Images",
    short: "Pull embedded images out of a PDF.",
    description:
      "Extract raster images embedded in a PDF and download them as a ZIP. Powered by pdf.js, fully in-browser.",
    category: "PDF",
    icon: ImagePlus,
    keywords: ["extract pdf images", "pdf images", "pdf to images", "get images from pdf"],
    inputType: "pdf",
    accent: "from-red-500/20 to-red-500/5 text-red-500",
    status: "stable",
  },

  // ---------------- Images (7) ----------------
  {
    slug: "image-compress",
    name: "Compress Image",
    short: "Shrink JPG, PNG and WebP images.",
    description:
      "Compress JPG, PNG and WebP images by adjusting quality and resolution using the browser canvas. No uploads.",
    category: "Images",
    icon: Minimize2,
    keywords: ["compress image", "image optimizer", "reduce image size", "compress jpg"],
    inputType: "multi-image",
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    popular: true,
    featured: true,
    status: "stable",
  },
  {
    slug: "image-resize",
    name: "Resize Image",
    short: "Resize images to exact dimensions.",
    description:
      "Resize images to a custom width/height or scale percentage, keeping aspect ratio optionally. Client-side canvas processing.",
    category: "Images",
    icon: Scaling,
    keywords: ["resize image", "image resizer", "scale image", "change image size"],
    inputType: "image",
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    status: "stable",
  },
  {
    slug: "image-convert",
    name: "Convert Image",
    short: "Convert between PNG, JPG and WebP.",
    description:
      "Convert images between PNG, JPG and WebP formats instantly in your browser.",
    category: "Images",
    icon: RefreshCw,
    keywords: ["convert image", "png to jpg", "jpg to png", "webp converter"],
    inputType: "image",
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    status: "stable",
  },
  {
    slug: "heic-to-jpg",
    name: "HEIC to JPG",
    short: "Convert iPhone HEIC photos to JPG.",
    description:
      "Convert HEIC/HEIF photos (from iPhone) to JPG in your browser using heic2any. No upload required.",
    category: "Images",
    icon: ImageDown,
    keywords: ["heic to jpg", "heic converter", "iphone photo converter", "heic to png"],
    inputType: "image",
    note: "HEIC decoding is CPU-intensive; large photos take a few seconds per image.",
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    status: "stable",
  },
  {
    slug: "image-rotate",
    name: "Rotate Image",
    short: "Rotate an image 90°, 180° or 270°.",
    description:
      "Rotate an image clockwise or counter-clockwise in your browser using the canvas. No upload.",
    category: "Images",
    icon: RotateCw,
    keywords: ["rotate image", "image rotator", "turn image", "rotate photo"],
    inputType: "image",
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    status: "stable",
  },
  {
    slug: "image-crop",
    name: "Crop Image",
    short: "Crop an image to a custom region.",
    description:
      "Crop an image by selecting a region or entering custom crop dimensions. Client-side canvas processing.",
    category: "Images",
    icon: Crop,
    keywords: ["crop image", "image cropper", "trim image", "cut image"],
    inputType: "image",
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    status: "stable",
  },
  {
    slug: "image-add-watermark",
    name: "Image Watermark",
    short: "Stamp a text watermark on an image.",
    description:
      "Add a custom text watermark to an image with control over opacity, size, position and color. Client-side canvas.",
    category: "Images",
    icon: Stamp,
    keywords: ["image watermark", "watermark photo", "stamp image", "add watermark image"],
    inputType: "image",
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    status: "stable",
  },

  // ---------------- Office (10) ----------------
  {
    slug: "excel-to-csv",
    name: "Excel to CSV",
    short: "Export Excel sheets to CSV.",
    description:
      "Convert .xlsx/.xls spreadsheets to CSV files, one per sheet, using SheetJS. Runs locally.",
    category: "Office",
    icon: FileSpreadsheet,
    keywords: ["excel to csv", "xlsx to csv", "convert spreadsheet", "xls to csv"],
    inputType: "multi-file",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },
  {
    slug: "csv-to-excel",
    name: "CSV to Excel",
    short: "Turn a CSV into a .xlsx workbook.",
    description:
      "Convert a CSV file into a formatted .xlsx Excel workbook using SheetJS, fully in-browser.",
    category: "Office",
    icon: Table,
    keywords: ["csv to excel", "csv to xlsx", "convert csv", "make spreadsheet"],
    inputType: "multi-file",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    short: "Turn a spreadsheet into a PDF table.",
    description:
      "Convert .xlsx/.xls spreadsheets to PDF with a clean table layout using SheetJS and jsPDF autoTable. Runs fully in your browser.",
    category: "Office",
    icon: FileSpreadsheet,
    keywords: ["excel to pdf", "xlsx to pdf", "spreadsheet to pdf", "xls to pdf"],
    inputType: "multi-file",
    note: "Cells are rendered as a table (no charts, formulas or styled formatting). For pixel-perfect output use Excel's native PDF export.",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },
  {
    slug: "docx-preview",
    name: "DOCX Preview",
    short: "Preview a .docx file in your browser.",
    description:
      "Render and preview a .docx document directly in the browser with docx-preview. No upload, no signup.",
    category: "Office",
    icon: FileSearch,
    keywords: ["docx preview", "view word document", "docx viewer online"],
    inputType: "multi-file",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },
  {
    slug: "text-to-pdf",
    name: "Text to PDF",
    short: "Turn plain text into a clean PDF.",
    description:
      "Convert a .txt file (or typed text) into a paginated PDF with jsPDF. Fully client-side, no uploads.",
    category: "Office",
    icon: FileOutput,
    keywords: ["text to pdf", "txt to pdf", "convert text to pdf", "make pdf from text"],
    inputType: "text",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },
  {
    slug: "markdown-to-pdf",
    name: "Markdown to PDF",
    short: "Render Markdown into a styled PDF.",
    description:
      "Convert Markdown text into a styled, paginated PDF using marked + jsPDF. Fully client-side.",
    category: "Office",
    icon: FileCode,
    keywords: ["markdown to pdf", "md to pdf", "convert markdown", "markdown pdf"],
    inputType: "text",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },
  {
    slug: "json-to-csv",
    name: "JSON to CSV",
    short: "Flatten JSON array into CSV.",
    description:
      "Convert an array of JSON objects into a CSV file using PapaParse. Runs locally in your browser.",
    category: "Office",
    icon: FileJson,
    keywords: ["json to csv", "convert json", "json csv", "flatten json"],
    inputType: "text",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },
  {
    slug: "csv-to-json",
    name: "CSV to JSON",
    short: "Turn CSV data into JSON.",
    description:
      "Convert a CSV file into a JSON array of objects using PapaParse. Fully client-side.",
    category: "Office",
    icon: Braces,
    keywords: ["csv to json", "convert csv", "csv json", "parse csv"],
    inputType: "text",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },
  {
    slug: "yaml-to-json",
    name: "YAML to JSON",
    short: "Convert YAML to JSON.",
    description:
      "Convert YAML into JSON using js-yaml. Runs entirely in your browser.",
    category: "Office",
    icon: Braces,
    keywords: ["yaml to json", "convert yaml", "yaml json"],
    inputType: "text",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },
  {
    slug: "json-to-yaml",
    name: "JSON to YAML",
    short: "Convert JSON to YAML.",
    description:
      "Convert JSON into YAML using js-yaml. Runs entirely in your browser.",
    category: "Office",
    icon: FileJson,
    keywords: ["json to yaml", "convert json yaml", "json yaml"],
    inputType: "text",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-500",
    status: "stable",
  },

  // ---------------- Utilities (11) ----------------
  {
    slug: "password-generator",
    name: "Password Generator",
    short: "Create strong, random passwords.",
    description:
      "Generate strong random passwords with adjustable length and character sets, plus a strength meter. Everything runs locally.",
    category: "Utilities",
    icon: KeyRound,
    keywords: ["password generator", "random password", "strong password", "secure password"],
    inputType: "none",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    popular: true,
    featured: true,
    status: "stable",
  },
  {
    slug: "qr-generator",
    name: "QR Generator",
    short: "Make a downloadable QR code.",
    description:
      "Generate a QR code for any text or URL and download it as a PNG or SVG. Client-side with the qrcode library.",
    category: "Utilities",
    icon: QrCode,
    keywords: ["qr generator", "qr code maker", "create qr code", "url to qr"],
    inputType: "text",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "qr-reader",
    name: "QR Reader",
    short: "Scan a QR code via webcam or image.",
    description:
      "Read a QR code from your webcam or an uploaded image using jsQR. Fully client-side — no video is uploaded.",
    category: "Utilities",
    icon: ScanLine,
    keywords: ["qr reader", "qr scanner", "scan qr code", "read qr"],
    inputType: "none",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "hash-generator",
    name: "Hash Generator",
    short: "MD5, SHA-1, SHA-256, SHA-512.",
    description:
      "Compute MD5, SHA-1, SHA-256 and SHA-512 hashes of text or files using the browser's native SubtleCrypto. Nothing is uploaded.",
    category: "Utilities",
    icon: Fingerprint,
    keywords: ["hash calculator", "sha256", "md5", "sha1", "checksum", "sha512"],
    inputType: "text",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "zip-create",
    name: "Create ZIP",
    short: "Zip multiple files into an archive.",
    description:
      "Combine multiple files into a single .zip archive, all in the browser with JSZip.",
    category: "Utilities",
    icon: FolderArchive,
    keywords: ["zip files", "create zip", "make archive", "compress files zip"],
    inputType: "multi-file",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "zip-extract",
    name: "Extract ZIP",
    short: "Unzip an archive in your browser.",
    description:
      "Extract the contents of a .zip archive and download individual files. Client-side with JSZip.",
    category: "Utilities",
    icon: FolderOutput,
    keywords: ["unzip", "extract zip", "decompress zip", "open zip"],
    inputType: "multi-file",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "file-rename-batch",
    name: "Batch Rename Files",
    short: "Rename many files, then download as ZIP.",
    description:
      "Rename multiple files at once (find & replace, prefix, suffix, sequence) and download them as a ZIP. 100% in-browser.",
    category: "Utilities",
    icon: PencilLine,
    keywords: ["batch rename", "rename files", "file renamer", "bulk rename"],
    inputType: "multi-file",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "text-tools",
    name: "Text Tools",
    short: "Case convert, count, slugify, lorem.",
    description:
      "A Swiss-army knife for text: change case, count words/characters, slugify and generate lorem ipsum — all locally.",
    category: "Utilities",
    icon: CaseSensitive,
    keywords: ["text tools", "case converter", "word count", "slugify", "lorem ipsum"],
    inputType: "text",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "color-picker",
    name: "Color Picker",
    short: "Pick colors + build a palette.",
    description:
      "Pick a color with the native picker, extract palettes from an uploaded image, and copy HEX/RGB/HSL values. Client-side.",
    category: "Utilities",
    icon: Pipette,
    keywords: ["color picker", "hex color", "palette generator", "rgb hsl"],
    inputType: "none",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "base64",
    name: "Base64 Encode/Decode",
    short: "Encode or decode Base64 (text + file).",
    description:
      "Base64-encode text or files, and decode Base64 back to text or a downloadable file. Runs entirely in your browser.",
    category: "Utilities",
    icon: Binary,
    keywords: ["base64", "encode base64", "decode base64", "base64 converter"],
    inputType: "text",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "url-encode-decode",
    name: "URL Encode/Decode",
    short: "Percent-encode or decode URLs.",
    description:
      "URL-encode (percent-encode) or decode text and URLs. Runs entirely in your browser.",
    category: "Utilities",
    icon: Link,
    keywords: ["url encode", "url decode", "percent encode", "uri encode"],
    inputType: "text",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    short: "Test regular expressions live.",
    description:
      "Test JavaScript regular expressions against text with live match highlighting and capture groups. Client-side.",
    category: "Utilities",
    icon: Regex,
    keywords: ["regex tester", "regular expression", "regex match", "test regex"],
    inputType: "text",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-500",
    status: "stable",
  },
];

export const toolsBySlug = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string): Tool | undefined {
  return toolsBySlug.get(slug);
}

export function toolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}

export const allSlugs = tools.map((t) => t.slug);
