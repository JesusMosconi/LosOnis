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
