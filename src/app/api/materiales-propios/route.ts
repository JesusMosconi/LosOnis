import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canAccessCotizador, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function authorize(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!canAccessCotizador(session)) return Response.json({ error: "Acceso exclusivo para Diego" }, { status: 403 });
  return null;
}

function materialData(body: Record<string, unknown>) {
  if (typeof body.nombre !== "string" || !body.nombre.trim()) throw new Error("El nombre es obligatorio");
  if (body.descripcion != null && typeof body.descripcion !== "string") throw new Error("La descripción es inválida");
  if (typeof body.precioUnitario !== "string" && typeof body.precioUnitario !== "number") throw new Error("El precio unitario es inválido");
  const normalizedPrice = String(body.precioUnitario).trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedPrice)) throw new Error("El precio unitario es inválido");
  return {
    nombre: body.nombre.trim(),
    descripcion: typeof body.descripcion === "string" ? body.descripcion.trim() || null : null,
    precioUnitario: new Prisma.Decimal(normalizedPrice),
  };
}

function serialize(material: { id: string; nombre: string; descripcion: string | null; precioUnitario: Prisma.Decimal }) {
  return { ...material, precioUnitario: material.precioUnitario.toFixed(2) };
}

export async function GET(request: Request) {
  const denied = authorize(await getSession());
  if (denied) return denied;
  try {
    const q = new URL(request.url).searchParams.get("q")?.trim();
    const materials = await prisma.materialPropio.findMany({
      where: { activo: true, ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}) },
      orderBy: [{ nombre: "asc" }, { id: "asc" }],
      select: { id: true, nombre: true, descripcion: true, precioUnitario: true },
    });
    return Response.json({ items: materials.map(serialize) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No se pudieron listar los materiales propios" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const denied = authorize(await getSession());
  if (denied) return denied;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Solicitud inválida");
    const material = await prisma.materialPropio.create({ data: materialData(body as Record<string, unknown>) });
    return Response.json(serialize(material), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo crear el material propio" }, { status: 400 });
  }
}

export { materialData, serialize };
