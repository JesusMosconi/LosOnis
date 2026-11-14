export type PdfVariant = "detailed" | "summary";

export function pdfVariantFromUrl(url: string): PdfVariant {
  return new URL(url).searchParams.get("variant") === "summary" ? "summary" : "detailed";
}
