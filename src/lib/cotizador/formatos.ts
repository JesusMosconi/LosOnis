const CANTIDAD_PATTERN = /^\d{1,9}(?:[.,]\d{1,3})?$/;

export function parsearCantidad(value: string | number) {
  const raw = String(value).trim();
  if (!CANTIDAD_PATTERN.test(raw)) {
    throw new Error("La cantidad debe ser mayor a cero, tener hasta 3 decimales y hasta 9 dígitos enteros.");
  }

  const parsed = Number(raw.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("La cantidad debe ser mayor a cero, tener hasta 3 decimales y hasta 9 dígitos enteros.");
  }
  return parsed;
}

export function normalizarCantidad(value: string | number) {
  return String(parsearCantidad(value));
}

export function formatearCantidad(value: string | number) {
  return normalizarCantidad(value).replace(".", ",");
}

export function calcularSubtotalCantidad(cantidadInput: string | number, precioInput: string | number) {
  const cantidad = normalizarCantidad(cantidadInput);
  const precio = String(precioInput).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(precio)) return 0;

  const [cantidadEntera, cantidadDecimal = ""] = cantidad.split(".");
  const [precioEntero, precioDecimal = ""] = precio.split(".");
  const mil = BigInt(1000);
  const cien = BigInt(100);
  const cantidadMilesimas = BigInt(cantidadEntera) * mil + BigInt(cantidadDecimal.padEnd(3, "0"));
  const precioCentavos = BigInt(precioEntero) * cien + BigInt(precioDecimal.padEnd(2, "0"));
  const producto = cantidadMilesimas * precioCentavos;
  const centavos = producto / mil + (producto % mil >= BigInt(500) ? BigInt(1) : BigInt(0));
  return Number(centavos) / 100;
}

export function nombreArchivoCotizacion(createdAt: Date, numero: number, titulo: string) {
  const dateParts = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(createdAt);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((value) => value.type === type)?.value ?? "";
  const fecha = `${part("year")}-${part("month").padStart(2, "0")}`;
  const numeroFormateado = String(numero).padStart(2, "0");
  const tituloSeguro = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${fecha}-${numeroFormateado}${tituloSeguro ? `-${tituloSeguro}` : ""}.pdf`;
}
