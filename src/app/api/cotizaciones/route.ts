import { Prisma } from "@/generated/prisma/client";
import { calcularCotizacion } from "@/lib/cotizador/calculos";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type InputItem = {
  itemCatalogoId?: unknown;
  nombre?: unknown;
  sku?: unknown;
  descripcion?: unknown;
  unidad?: unknown;
  cantidad?: unknown;
  precioUnitario?: unknown;
};

function text(value: unknown, maxLength: number, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== "string") throw new Error("Campo de texto inválido");
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maxLength) throw new Error("Campo de texto inválido");
  return cleaned || null;
}

function decimal(value: unknown, field: string, scale: number) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`${field} inválido`);
  }
  const normalized = String(value).trim().replace(",", ".");
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${scale}})?$`).test(normalized)) {
    throw new Error(`${field} inválido`);
  }
  return new Prisma.Decimal(normalized);
}

function serializeQuote(quote: Awaited<ReturnType<typeof createQuote>>) {
  return {
    ...quote,
    subtotalMateriales: quote.subtotalMateriales.toFixed(2),
    porcentajeGastos: quote.porcentajeGastos.toString(),
    montoGastos: quote.montoGastos.toFixed(2),
    porcentajeManoObra: quote.porcentajeManoObra.toString(),
    montoManoObra: quote.montoManoObra.toFixed(2),
    total: quote.total.toFixed(2),
    items: quote.items.map((item) => ({
      ...item,
      cantidad: item.cantidad.toString(),
      precioUnitario: item.precioUnitario.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    })),
  };
}

async function createQuote(body: Record<string, unknown>, userId: string) {
  const rawItems = body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 200) {
    throw new Error("La cotización debe tener entre 1 y 200 materiales");
  }
  const inputItems = rawItems as InputItem[];
  const clienteNombre = text(body.clienteNombre, 160, true) as string;
  const clienteTelefono = text(body.clienteTelefono, 50);
  const titulo = text(body.titulo, 200, true) as string;
  const descripcion = text(body.descripcion, 4000);
  const notas = text(body.notas, 4000);
  if (body.estado != null && body.estado !== "BORRADOR" && body.estado !== "FINALIZADA") {
    throw new Error("Estado de cotización inválido");
  }
  const estado = body.estado === "FINALIZADA" ? "FINALIZADA" : "BORRADOR";
  const porcentajeGastos = decimal(body.porcentajeGastos ?? 0, "Porcentaje de gastos", 4);
  const porcentajeManoObra = decimal(body.porcentajeManoObra ?? 0, "Porcentaje de mano de obra", 4);
  const validaHastaRaw = body.validaHasta;
  const validaHasta =
    validaHastaRaw == null || validaHastaRaw === ""
      ? null
      : typeof validaHastaRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(validaHastaRaw)
        ? new Date(`${validaHastaRaw}T12:00:00Z`)
        : (() => { throw new Error("Fecha de validez inválida"); })();

  return prisma.$transaction(async (tx) => {
    const catalogIds = inputItems
      .map((item) => item.itemCatalogoId)
      .filter((id): id is string => typeof id === "string" && Boolean(id));
    const catalogItems = await tx.itemCatalogo.findMany({
      where: { id: { in: [...new Set(catalogIds)] }, activo: true, producto: { activo: true } },
      include: { producto: { select: { urlOrigen: true } } },
    });
    const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
    if (catalogById.size !== new Set(catalogIds).size) {
      throw new Error("Uno o más materiales del catálogo no existen o están inactivos");
    }

    const lines = inputItems.map((item, index) => {
      const cantidad = decimal(item.cantidad, `Cantidad del material ${index + 1}`, 3);
      const catalogItem =
        typeof item.itemCatalogoId === "string" ? catalogById.get(item.itemCatalogoId) : undefined;
      if (catalogItem) {
        return {
          itemCatalogoId: catalogItem.id,
          nombre: catalogItem.nombre,
          sku: catalogItem.sku,
          descripcion: text(item.descripcion, 1000),
          unidad: text(item.unidad, 50),
          cantidad,
          precioUnitario: catalogItem.precio,
          urlOrigen: catalogItem.producto.urlOrigen,
        };
      }
      if (item.itemCatalogoId) throw new Error(`Material ${index + 1} inválido`);
      return {
        itemCatalogoId: null,
        nombre: text(item.nombre, 200, true) as string,
        sku: text(item.sku, 100),
        descripcion: text(item.descripcion, 1000),
        unidad: text(item.unidad, 50),
        cantidad,
        precioUnitario: decimal(item.precioUnitario, `Precio del material ${index + 1}`, 2),
        urlOrigen: null,
      };
    });
    const totals = calcularCotizacion(lines, porcentajeGastos, porcentajeManoObra);

    return tx.cotizacion.create({
      data: {
        estado,
        clienteNombre,
        clienteTelefono,
        titulo,
        descripcion,
        notas,
        validaHasta,
        creadaPorId: userId,
        subtotalMateriales: totals.subtotalMateriales,
        porcentajeGastos: totals.porcentajeGastos,
        montoGastos: totals.montoGastos,
        porcentajeManoObra: totals.porcentajeManoObra,
        montoManoObra: totals.montoManoObra,
        total: totals.total,
        items: {
          create: lines.map((line, index) => ({
            ...line,
            subtotal: totals.subtotales[index],
            orden: index,
          })),
        },
      },
      include: { items: { orderBy: { orden: "asc" } } },
    });
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Solicitud inválida");
    const quote = await createQuote(body as Record<string, unknown>, session.id);
    return Response.json(serializeQuote(quote), { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo crear la cotización" },
      { status: 400 },
    );
  }
}
