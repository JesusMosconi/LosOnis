import { Prisma } from "@/generated/prisma/client";
import { calcularCotizacion } from "@/lib/cotizador/calculos";

export type InputItem = {
  itemCatalogoId?: unknown;
  nombre?: unknown;
  sku?: unknown;
  descripcion?: unknown;
  unidad?: unknown;
  cantidad?: unknown;
  precioUnitario?: unknown;
};

export type InputAdicional = {
  descripcion?: unknown;
  monto?: unknown;
};

export function text(value: unknown, maxLength: number, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== "string") throw new Error("Campo de texto inválido");
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maxLength) throw new Error("Campo de texto inválido");
  return cleaned || null;
}

export function decimal(value: unknown, field: string, scale: number) {
  if (typeof value !== "string" && typeof value !== "number") throw new Error(`${field} inválido`);
  const normalized = String(value).trim().replace(",", ".");
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${scale}})?$`).test(normalized)) {
    throw new Error(`${field} inválido`);
  }
  return new Prisma.Decimal(normalized);
}

export function validateQuoteBody(body: Record<string, unknown>, tituloOpcional = false) {
  const rawItems = body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 200) {
    throw new Error("La cotización debe tener entre 1 y 200 materiales");
  }
  if (body.estado != null && body.estado !== "BORRADOR" && body.estado !== "FINALIZADA") {
    throw new Error("Estado de cotización inválido");
  }
  const rawAdicionales = body.adicionales ?? [];
  if (!Array.isArray(rawAdicionales)) throw new Error("Adicionales inválidos");
  const validaHastaRaw = body.validaHasta;
  const validaHasta = validaHastaRaw == null || validaHastaRaw === ""
    ? null
    : typeof validaHastaRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(validaHastaRaw)
      ? new Date(`${validaHastaRaw}T12:00:00Z`)
      : (() => { throw new Error("Fecha de validez inválida"); })();

  return {
    inputItems: rawItems as InputItem[],
    inputAdicionales: rawAdicionales as InputAdicional[],
    clienteNombre: text(body.clienteNombre, 160, true) as string,
    clienteTelefono: text(body.clienteTelefono, 50),
    titulo: text(body.titulo, 200, !tituloOpcional) ?? "",
    descripcion: text(body.descripcion, 4000),
    notas: text(body.notas, 4000),
    estado: body.estado === "FINALIZADA" ? ("FINALIZADA" as const) : ("BORRADOR" as const),
    porcentajeGastos: decimal(body.porcentajeGastos ?? 0, "Porcentaje de insumos y viáticos", 4),
    porcentajeManoObra: decimal(body.porcentajeManoObra ?? 0, "Porcentaje de mano de obra", 4),
    validaHasta,
  };
}

export async function prepareQuote(
  body: Record<string, unknown>,
  tx: Prisma.TransactionClient,
  options: { tituloOpcional?: boolean } = {},
) {
  const validated = validateQuoteBody(body, options.tituloOpcional);
  const catalogIds = validated.inputItems
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

  const lines = validated.inputItems.map((item, index) => {
    const cantidad = decimal(item.cantidad, `Cantidad del material ${index + 1}`, 3);
    const catalogItem = typeof item.itemCatalogoId === "string"
      ? catalogById.get(item.itemCatalogoId)
      : undefined;
    if (catalogItem) {
      return {
        itemCatalogoId: catalogItem.id,
        nombre: catalogItem.nombre,
        sku: catalogItem.sku,
        descripcion: text(item.descripcion, 1000),
        unidad: text(item.unidad, 200),
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
      unidad: text(item.unidad, 200),
      cantidad,
      precioUnitario: decimal(item.precioUnitario, `Precio del material ${index + 1}`, 2),
      urlOrigen: null,
    };
  });
  const adicionales = validated.inputAdicionales.map((adicional, index) => {
    if (!adicional || typeof adicional !== "object" || Array.isArray(adicional)) {
      throw new Error(`Adicional ${index + 1} inválido`);
    }
    const monto = decimal(adicional.monto, `Monto del adicional ${index + 1}`, 2);
    const descripcion = text(adicional.descripcion, 200, monto.greaterThan(0));
    return { descripcion: descripcion ?? "", monto };
  });
  const totals = calcularCotizacion(
    lines,
    validated.porcentajeGastos,
    validated.porcentajeManoObra,
    adicionales,
  );
  return { validated, lines, adicionales, totals };
}

type SerializableQuote = {
  subtotalMateriales: Prisma.Decimal;
  porcentajeGastos: Prisma.Decimal;
  montoGastos: Prisma.Decimal;
  porcentajeManoObra: Prisma.Decimal;
  montoManoObra: Prisma.Decimal;
  montoAdicionales: Prisma.Decimal;
  total: Prisma.Decimal;
  items: Array<{ cantidad: Prisma.Decimal; precioUnitario: Prisma.Decimal; subtotal: Prisma.Decimal }>;
  adicionales: Array<{ monto: Prisma.Decimal }>;
};

export function serializeQuote<T extends SerializableQuote>(quote: T) {
  return {
    ...quote,
    subtotalMateriales: quote.subtotalMateriales.toFixed(2),
    porcentajeGastos: quote.porcentajeGastos.toString(),
    montoGastos: quote.montoGastos.toFixed(2),
    porcentajeManoObra: quote.porcentajeManoObra.toString(),
    montoManoObra: quote.montoManoObra.toFixed(2),
    montoAdicionales: quote.montoAdicionales.toFixed(2),
    total: quote.total.toFixed(2),
    items: quote.items.map((item) => ({
      ...item,
      cantidad: item.cantidad.toString(),
      precioUnitario: item.precioUnitario.toFixed(2),
      subtotal: item.subtotal.toFixed(2),
    })),
    adicionales: quote.adicionales.map((adicional) => ({
      ...adicional,
      monto: adicional.monto.toFixed(2),
    })),
  };
}
