import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canAccessCotizador, getSession } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const session = await getSession();
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!canAccessCotizador(session)) return Response.json({ error: "Acceso exclusivo para Diego" }, { status: 403 });
  const { id } = await context.params;
  try {
    const pedido = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
      const quote = await tx.cotizacion.findUnique({ where: { id }, include: { pedido: true } });
      if (!quote) return null;
      if (quote.pedido) return quote.pedido;
      if (!quote.titulo.trim()) throw new Error("La cotización necesita un título para crear el pedido");
      await tx.cotizacion.update({ where: { id }, data: { estado: "FINALIZADA" } });
      return tx.pedido.create({
        data: {
          cotizacionId: quote.id,
          nombre: quote.clienteNombre,
          telefono: quote.clienteTelefono,
          titulo: quote.titulo,
          descripcion: quote.descripcion,
          montoTotal: quote.montoManoObra,
        },
      });
    });
    if (!pedido) return Response.json({ error: "Cotización no encontrada" }, { status: 404 });
    return Response.json({ id: pedido.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const pedido = await prisma.pedido.findUnique({ where: { cotizacionId: id } });
      if (pedido) return Response.json({ id: pedido.id });
    }
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo confirmar la cotización" }, { status: 400 });
  }
}
