import { Prisma } from "@/generated/prisma/client";
import { prepareQuote, serializeQuote } from "@/lib/cotizador/validacion";
import { prisma } from "@/lib/prisma";
import { canAccessCotizador, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function GET(_request: Request, context: Context) {
  const session = await getSession();
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!canAccessCotizador(session)) return Response.json({ error: "Acceso exclusivo para Diego" }, { status: 403 });
  const { id } = await context.params;
  const quote = await prisma.cotizacion.findUnique({
    where: { id },
    include: {
      items: { orderBy: { orden: "asc" } },
      adicionales: { orderBy: { orden: "asc" } },
    },
  });
  if (!quote) return Response.json({ error: "Cotización no encontrada" }, { status: 404 });
  return Response.json(serializeQuote(quote));
}

export async function PUT(request: Request, context: Context) {
  const session = await getSession();
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!canAccessCotizador(session)) return Response.json({ error: "Acceso exclusivo para Diego" }, { status: 403 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Solicitud inválida");
    const { id } = await context.params;
    const quote = await prisma.$transaction(async (tx) => {
      const exists = await tx.cotizacion.findUnique({ where: { id }, select: { id: true } });
      if (!exists) {
        throw new Prisma.PrismaClientKnownRequestError("Cotización no encontrada", {
          code: "P2025",
          clientVersion: Prisma.prismaVersion.client,
        });
      }
      const { validated, lines, adicionales, totals } = await prepareQuote(body as Record<string, unknown>, tx);
      await tx.itemCotizacion.deleteMany({ where: { cotizacionId: id } });
      await tx.adicionalCotizacion.deleteMany({ where: { cotizacionId: id } });
      return tx.cotizacion.update({
        where: { id },
        data: {
          estado: validated.estado,
          clienteNombre: validated.clienteNombre,
          clienteTelefono: validated.clienteTelefono,
          titulo: validated.titulo,
          descripcion: validated.descripcion,
          notas: validated.notas,
          validaHasta: validated.validaHasta,
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
    });
    return Response.json(serializeQuote(quote));
  } catch (error) {
    if (isNotFound(error)) return Response.json({ error: "Cotización no encontrada" }, { status: 404 });
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar la cotización" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  const session = await getSession();
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!canAccessCotizador(session)) return Response.json({ error: "Acceso exclusivo para Diego" }, { status: 403 });
  try {
    const { id } = await context.params;
    await prisma.cotizacion.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    if (isNotFound(error)) return Response.json({ error: "Cotización no encontrada" }, { status: 404 });
    return Response.json({ error: "No se pudo eliminar la cotización" }, { status: 500 });
  }
}
