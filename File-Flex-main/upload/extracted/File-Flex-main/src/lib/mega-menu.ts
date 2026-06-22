import {
  FilePlus2,
  Scissors,
  FileArchive,
  RotateCw,
  ListOrdered,
  FileX2,
  ScanText,
  ImagePlus,
  Stamp,
  Hash,
  FileCog,
  Images,
  FileImage,
  Lock,
  Unlock,
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
  KeyRound,
  QrCode,
  ScanLine,
  Fingerprint,
  FolderArchive,
  FolderOutput,
  PencilLine,
  CaseSensitive,
  Pipette,
  Binary,
  Link,
  Regex,
  type LucideIcon,
} from "lucide-react";
import { tools } from "./tools";

export interface MegaMenuItem {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface MegaMenuColumn {
  title: string;
  items: MegaMenuItem[];
}

/** Helper: build a MegaMenuItem from a tool slug. */
function fromTool(slug: string): MegaMenuItem {
  const t = tools.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown tool slug: ${slug}`);
  return {
    label: t.name,
    description: t.short,
    href: `/tools/${t.slug}`,
    icon: t.icon,
  };
}

/* ------------------------------------------------------------------ */
/* CONVERT PDF mega menu (honest — client-side only)                  */
/* ------------------------------------------------------------------ */
export const convertPdfMenu: MegaMenuColumn[] = [
  {
    title: "Convert from PDF",
    items: [fromTool("pdf-to-jpg"), fromTool("pdf-extract-text")],
  },
  {
    title: "Convert to PDF",
    items: [
      fromTool("jpg-to-pdf"),
      fromTool("text-to-pdf"),
      fromTool("markdown-to-pdf"),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* ALL PDF TOOLS mega menu (grouped by category)                       */
/* ------------------------------------------------------------------ */
const pdfSlugs = [
  "pdf-merge", "pdf-split", "pdf-compress", "pdf-rotate", "pdf-reorder",
  "pdf-delete-pages", "pdf-extract-text", "pdf-extract-images",
  "pdf-add-watermark", "pdf-add-page-numbers", "pdf-edit-metadata",
  "pdf-password", "pdf-unlock", "jpg-to-pdf", "pdf-to-jpg",
];
const imageSlugs = [
  "image-compress", "image-resize", "image-convert", "image-rotate",
  "image-crop", "image-add-watermark", "heic-to-jpg",
];
const officeSlugs = [
  "excel-to-csv", "csv-to-excel", "excel-to-pdf", "markdown-to-pdf",
  "text-to-pdf", "docx-preview", "json-to-csv", "csv-to-json",
  "yaml-to-json", "json-to-yaml",
];
const utilSlugs = [
  "password-generator", "qr-generator", "qr-reader", "hash-generator",
  "zip-create", "zip-extract", "file-rename-batch", "text-tools",
  "color-picker", "base64", "url-encode-decode", "regex-tester",
];

export const allToolsMenu: MegaMenuColumn[] = [
  { title: "PDF", items: pdfSlugs.map(fromTool) },
  { title: "Image", items: imageSlugs.map(fromTool) },
  { title: "Office", items: officeSlugs.map(fromTool) },
  { title: "Utilities", items: utilSlugs.map(fromTool) },
];

/* ------------------------------------------------------------------ */
/* APPS mega menu (9-dot) — honest                                    */
/* ------------------------------------------------------------------ */
export const appsMenu: MegaMenuColumn[] = [
  {
    title: "Products",
    items: [
      { label: "FileFlex Web", description: "Use it right now in your browser.", href: "/", icon: FileCode },
      { label: "FileFlex Desktop", description: "Native app — coming soon.", href: "#", icon: FileArchive, disabled: true },
      { label: "FileFlex Mobile", description: "iOS & Android — coming soon.", href: "#", icon: Images, disabled: true },
    ],
  },
  {
    title: "Solutions",
    items: [
      { label: "For Students", description: "Quick homework & study tools.", href: "/solutions/students", icon: FileSearch },
      { label: "For Teams", description: "Bulk tools for shared work.", href: "/solutions/teams", icon: Table },
      { label: "For Developers", description: "Hash, base64, regex & more.", href: "/solutions/developers", icon: Braces },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Help Center", description: "Guides & FAQs.", href: "/help", icon: FileOutput },
      { label: "Contact", description: "Get in touch.", href: "/contact", icon: Link },
      { label: "Status", description: "All systems normal.", href: "/status", icon: ScanLine },
    ],
  },
  {
    title: "Language",
    items: [
      { label: "English", description: "Default language.", href: "#", icon: FileJson },
    ],
  },
];
