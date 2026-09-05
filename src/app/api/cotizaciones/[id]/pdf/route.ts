import { renderToBuffer } from "@react-pdf/renderer";
import { CotizacionPdf, type CotizacionPdfData } from "@/lib/cotizador/pdf";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function pdfFilename(createdAt: Date, numero: number, titulo: string) {
  const dateParts = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(createdAt);
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((value) => value.type === type)?.value ?? "";
  const fecha = `${part("day")}-${part("month")}-${part("year")}`;
  const automaticTitle = titulo.startsWith(`Cotización #${numero} - `);
  const safeTitle = automaticTitle ? "" : titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
  return `${fecha}-cotizacion-${numero}${safeTitle ? `-${safeTitle}` : ""}.pdf`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return Response.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const quote = await prisma.cotizacion.findUnique({
    where: { id },
    include: {
      items: { orderBy: { orden: "asc" } },
      adicionales: { orderBy: { orden: "asc" } },
    },
  });
  if (!quote) return Response.json({ error: "Cotización no encontrada" }, { status: 404 });

  const data: CotizacionPdfData = {
    numero: quote.numero,
    titulo: quote.titulo,
    clienteNombre: quote.clienteNombre,
    clienteTelefono: quote.clienteTelefono,
    createdAt: quote.createdAt.toISOString(),
    subtotalMateriales: quote.subtotalMateriales.toFixed(2),
    montoGastos: quote.montoGastos.toFixed(2),
    montoManoObra: quote.montoManoObra.toFixed(2),
    montoAdicionales: quote.montoAdicionales.toFixed(2),
    total: quote.total.toFixed(2),
    items: quote.items.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      sku: item.sku,
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.cantidad.toString(),
      precioUnitario: item.precioUnitario.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
      urlOrigen: item.urlOrigen,
    })),
    adicionales: quote.adicionales.map((adicional) => ({
      id: adicional.id,
      descripcion: adicional.descripcion,
      monto: adicional.monto.toFixed(2),
    })),
  };
  const buffer = await renderToBuffer(CotizacionPdf({ quote: data }));
  const bytes = Uint8Array.from(buffer);

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(quote.createdAt, quote.numero, quote.titulo)}"`,
      "Content-Length": String(bytes.byteLength),
    },
  });
}
