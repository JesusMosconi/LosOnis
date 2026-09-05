import { Prisma } from "@/generated/prisma/client";
import {
  catalogSearchScore,
  catalogSearchTerms,
  normalizeCatalogSearch,
} from "@/lib/catalogo/search";
import { prisma } from "@/lib/prisma";
import { canAccessCotizador, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!canAccessCotizador(session)) {
    return Response.json({ error: "Acceso exclusivo para Diego" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const normalizedQuery = normalizeCatalogSearch(params.get("q") ?? "");
  const terms = catalogSearchTerms(normalizedQuery);
  const category = params.get("categoria")?.trim();
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(params.get("limit") ?? "20", 10) || 20));
  const where: Prisma.ItemCatalogoWhereInput = {
    activo: true,
    producto: {
      activo: true,
      ...(category ? { categorias: { some: { slug: category } } } : {}),
    },
    ...(terms.length
      ? { AND: terms.map((term) => ({ textoBusqueda: { contains: term } })) }
      : {}),
  };

  const [candidates, total] = await Promise.all([
    prisma.itemCatalogo.findMany({
      where,
      include: {
        producto: {
          select: { nombre: true, urlOrigen: true, categorias: { select: { nombre: true, slug: true } } },
        },
      },
      orderBy: [{ nombre: "asc" }, { id: "asc" }],
      take: terms.length ? 1000 : pageSize,
      skip: terms.length ? 0 : (page - 1) * pageSize,
    }),
    prisma.itemCatalogo.count({ where }),
  ]);
  const ranked = terms.length
    ? candidates.sort((a, b) => {
        return (
          catalogSearchScore(a.textoBusqueda, a.sku, normalizedQuery) -
            catalogSearchScore(b.textoBusqueda, b.sku, normalizedQuery) ||
          a.nombre.localeCompare(b.nombre, "es")
        );
      })
    : candidates;
  const items = terms.length
    ? ranked.slice((page - 1) * pageSize, page * pageSize)
    : ranked;

  return Response.json({
    items: items.map((item) => ({
      id: item.id,
      name: item.nombre,
      sku: item.sku,
      price: item.precio.toFixed(2),
      inStock: item.enStock,
      attributes: item.atributos,
      product: item.producto,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
