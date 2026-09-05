export function argentinePriceToCents(value: string): number {
  const normalized = value
    .replace(/\u00a0/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "");
  const match = normalized.match(/^(-?)(\d+)(?:,(\d{1,2}))?$/);
  if (!match) throw new Error(`Formato de precio inesperado: ${JSON.stringify(value)}`);
  const [, sign, integerPart, decimalPart = ""] = match;
  const cents = Number(integerPart) * 100 + Number(decimalPart.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new Error(`Precio fuera del rango seguro: ${value}`);
  return sign === "-" ? -cents : cents;
}

export function wooPriceToCents(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new Error(`display_price inválido: ${JSON.stringify(value)}`);
  }
  const normalized = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error(`display_price inválido: ${JSON.stringify(value)}`);
  }
  const [integerPart, decimals = ""] = normalized.split(".");
  let cents = Number(integerPart) * 100 + Number(decimals.slice(0, 2).padEnd(2, "0"));
  if (Number(decimals[2] ?? "0") >= 5) cents += 1;
  if (!Number.isSafeInteger(cents)) throw new Error(`Precio fuera del rango seguro: ${value}`);
  return cents;
}

export function centsToDecimalString(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error(`Centavos inválidos: ${cents}`);
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}
