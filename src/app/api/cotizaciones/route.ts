import { Prisma } from "@/generated/prisma/client";
import { prepareQuote, serializeQuote } from "@/lib/cotizador/validacion";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function positiveInteger(value: string | null, fallback: number) {
  if (value == null) return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1) throw new Error("Paginación inválida");
  return Number(value);
}

export async function GET(request: Request) {
  if (!(await getSession())) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const params = new URL(request.url).searchParams;
    const page = positiveInteger(params.get("page"), 1);
    const pageSize = Math.min(positiveInteger(params.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const estado = params.get("estado");
    if (estado !== null && estado !== "BORRADOR" && estado !== "FINALIZADA") {
      throw new Error("Estado de cotización inválido");
    }
    const clienteNombre = params.get("clienteNombre")?.trim();
    const where: Prisma.CotizacionWhereInput = {
      ...(estado ? { estado } : {}),
      ...(clienteNombre ? { clienteNombre: { contains: clienteNombre, mode: "insensitive" } } : {}),
    };
    const [quotes, total] = await prisma.$transaction([
      prisma.cotizacion.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          numero: true,
          estado: true,
          titulo: true,
          clienteNombre: true,
          clienteTelefono: true,
          validaHasta: true,
          subtotalMateriales: true,
          total: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.cotizacion.count({ where }),
    ]);
    return Response.json({
      items: quotes.map((quote) => ({
        ...quote,
        subtotalMateriales: quote.subtotalMateriales.toFixed(2),
        total: quote.total.toFixed(2),
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudieron listar las cotizaciones" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Solicitud inválida");
    const quote = await prisma.$transaction(async (tx) => {
      const { validated, lines, adicionales, totals } = await prepareQuote(body as Record<string, unknown>, tx, {
        tituloOpcional: true,
      });
      const created = await tx.cotizacion.create({
        data: {
          estado: validated.estado,
          clienteNombre: validated.clienteNombre,
          clienteTelefono: validated.clienteTelefono,
          titulo: validated.titulo ?? "",
          descripcion: validated.descripcion,
          notas: validated.notas,
          validaHasta: validated.validaHasta,
          creadaPorId: session.id,
          subtotalMateriales: totals.subtotalMateriales,
          porcentajeGastos: totals.porcentajeGastos,
          montoGastos: totals.montoGastos,
          porcentajeManoObra: totals.porcentajeManoObra,
          montoManoObra: totals.montoManoObra,
          montoAdicionales: totals.montoAdicionales,
          total: totals.total,
          items: { create: lines.map((line, index) => ({
            ...line,
            subtotal: totals.subtotales[index],
            orden: index,
          })) },
          adicionales: { create: adicionales.map((adicional, index) => ({
            ...adicional,
            orden: index,
          })) },
        },
        include: {
          items: { orderBy: { orden: "asc" } },
          adicionales: { orderBy: { orden: "asc" } },
        },
      });
      if (validated.titulo) return created;

      const date = new Date().toLocaleDateString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
      });
      return tx.cotizacion.update({
        where: { id: created.id },
        data: { titulo: `Cotización #${created.numero} - ${date}` },
        include: {
          items: { orderBy: { orden: "asc" } },
          adicionales: { orderBy: { orden: "asc" } },
        },
      });
    });
    return Response.json(serializeQuote(quote), { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo crear la cotización" },
      { status: 400 },
    );
  }
}
