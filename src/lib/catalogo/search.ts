export function normalizeCatalogSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/(\d)\s*[x×]\s*(?=\d)/g, "$1 ")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/[^a-z0-9,.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function catalogSearchTerms(value: string): string[] {
  return [...new Set(normalizeCatalogSearch(value).split(" ").filter(Boolean))].slice(0, 10);
}

export function catalogSearchScore(text: string, sku: string | null, normalizedQuery: string) {
  if (normalizeCatalogSearch(sku ?? "") === normalizedQuery) return 0;
  if (text.includes(normalizedQuery)) return 1;
  return 2;
}
