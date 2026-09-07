import { Prisma } from "@/generated/prisma/client";
import { materialData, serialize } from "@/app/api/materiales-propios/route";
import { prisma } from "@/lib/prisma";
import { canAccessCotizador, getSession } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

async function authorize() {
  const session = await getSession();
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!canAccessCotizador(session)) return Response.json({ error: "Acceso exclusivo para Diego" }, { status: 403 });
  return null;
}

export async function PUT(request: Request, context: Context) {
  const denied = await authorize();
  if (denied) return denied;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Solicitud inválida");
    const { id } = await context.params;
    const material = await prisma.materialPropio.update({
      where: { id, activo: true },
      data: materialData(body as Record<string, unknown>),
    });
    return Response.json(serialize(material));
  } catch (error) {
    if (isNotFound(error)) return Response.json({ error: "Material propio no encontrado" }, { status: 404 });
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo actualizar el material propio" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await authorize();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await prisma.materialPropio.update({ where: { id, activo: true }, data: { activo: false } });
    return Response.json({ ok: true });
  } catch (error) {
    if (isNotFound(error)) return Response.json({ error: "Material propio no encontrado" }, { status: 404 });
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo eliminar el material propio" }, { status: 400 });
  }
}
