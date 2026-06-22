/**
 * qpdf-wasm helper — real PDF encryption/decryption in the browser.
 *
 * Verified working: AES-256 encryption produces a file with /Encrypt + /AESV3
 * that PDF readers (Chrome, Acrobat, Preview) refuse to open without the
 * password. Decryption with the correct password removes /Encrypt; with a wrong
 * password qpdf returns a non-zero exit code.
 *
 * The wasm binary is served from /wasm/qpdf.wasm (copied from
 * @neslinesli93/qpdf-wasm/dist/qpdf.wasm into public/wasm/).
 */
import createModule from "@neslinesli93/qpdf-wasm";

/** Extended FS interface (the types are incomplete in the package). */
interface FullFS {
  writeFile(path: string, data: Uint8Array): void;
  readFile(path: string): Uint8Array;
}

interface FullQpdfInstance {
  FS: FullFS;
  callMain: (args: string[]) => number;
}

let qpdfPromise: Promise<FullQpdfInstance> | null = null;

/** Initialise qpdf-wasm once and cache the instance. */
async function getQpdf(): Promise<FullQpdfInstance> {
  if (!qpdfPromise) {
    const opts = {
      locateFile: () => "/wasm/qpdf.wasm",
      noInitialRun: true,
    };
    // qpdf-wasm types don't include noInitialRun; cast to match the real API
    qpdfPromise = createModule(opts as { locateFile: () => string }) as unknown as Promise<FullQpdfInstance>;
  }
  return qpdfPromise;
}

export interface EncryptOptions {
  /** Required — needed to OPEN the file. */
  userPassword: string;
  /** Optional — defaults to userPassword. */
  ownerPassword?: string;
  /** Allow printing the protected file (default false). */
  allowPrint?: boolean;
  /** Allow copying text/graphics (default false). */
  allowCopy?: boolean;
}

/**
 * Encrypt a PDF with AES-256. Returns the encrypted PDF bytes.
 * The output requires `userPassword` to open in any PDF reader.
 */
export async function encryptPdf(
  input: Uint8Array,
  opts: EncryptOptions
): Promise<Uint8Array> {
  const user = opts.userPassword;
  if (!user) throw new Error("A user password is required.");
  const owner = opts.ownerPassword || user;

  const qpdf = await getQpdf();

  qpdf.FS.writeFile("/input.pdf", input);

  const args = [
    "/input.pdf",
    "--encrypt",
    user,
    owner,
    "256",
    opts.allowPrint ? "--print=full" : "--print=none",
    "--modify=none",
    opts.allowCopy ? "--extract=y" : "--extract=n",
    "--annotate=n",
    "--",
    "/output.pdf",
  ];

  const rc = qpdf.callMain(args);
  if (rc !== 0) {
    throw new Error(`qpdf encryption failed (exit code ${rc}).`);
  }
  return qpdf.FS.readFile("/output.pdf");
}

/**
 * Remove the password from a protected PDF. The correct password is required —
 * we never bypass encryption. Returns the decrypted PDF bytes.
 */
export async function decryptPdf(
  input: Uint8Array,
  password: string
): Promise<Uint8Array> {
  if (!password) throw new Error("The current password is required.");
  const qpdf = await getQpdf();
  qpdf.FS.writeFile("/input.pdf", input);
  const rc = qpdf.callMain([
    "/input.pdf",
    "--decrypt",
    `--password=${password}`,
    "/output.pdf",
  ]);
  if (rc !== 0) {
    throw new Error("Incorrect password, or the file is not a password-protected PDF.");
  }
  return qpdf.FS.readFile("/output.pdf");
}
