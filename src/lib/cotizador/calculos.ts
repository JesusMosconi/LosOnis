import { Prisma } from "@/generated/prisma/client";

type DecimalInput = string | number | Prisma.Decimal;

export type LineaCalculable = {
  cantidad: DecimalInput;
  precioUnitario: DecimalInput;
};

export type AdicionalCalculable = {
  monto: DecimalInput;
};

export type TotalesCotizacion = {
  subtotalMateriales: Prisma.Decimal;
  porcentajeGastos: Prisma.Decimal;
  montoGastos: Prisma.Decimal;
  porcentajeManoObra: Prisma.Decimal;
  montoManoObra: Prisma.Decimal;
  montoAdicionales: Prisma.Decimal;
  total: Prisma.Decimal;
  subtotales: Prisma.Decimal[];
};

const money = (value: Prisma.Decimal) => value.toDecimalPlaces(2);
const ceilingTen = (value: Prisma.Decimal) => value.div(10).ceil().mul(10);

function decimal(value: DecimalInput, field: string) {
  try {
    return new Prisma.Decimal(value);
  } catch {
    throw new Error(`${field} no es un número válido`);
  }
}

function percentage(value: DecimalInput, field: string) {
  const parsed = decimal(value, field);
  if (parsed.isNegative() || parsed.greaterThan(1000)) {
    throw new Error(`${field} debe estar entre 0 y 1000`);
  }
  return parsed;
}

export function calcularCotizacion(
  lineas: LineaCalculable[],
  porcentajeGastosInput: DecimalInput,
  porcentajeManoObraInput: DecimalInput,
  adicionales: AdicionalCalculable[] = [],
): TotalesCotizacion {
  if (lineas.length === 0) throw new Error("La cotización debe incluir al menos un material");

  const subtotales = lineas.map((linea, index) => {
    const cantidad = decimal(linea.cantidad, `Cantidad del material ${index + 1}`);
    const precio = decimal(linea.precioUnitario, `Precio del material ${index + 1}`);
    if (cantidad.lessThanOrEqualTo(0)) {
      throw new Error(`La cantidad del material ${index + 1} debe ser mayor a cero`);
    }
    if (precio.isNegative()) throw new Error(`El precio del material ${index + 1} no puede ser negativo`);
    return money(cantidad.mul(precio));
  });
  const subtotalMateriales = money(
    subtotales.reduce((total, subtotal) => total.add(subtotal), new Prisma.Decimal(0)),
  );
  const porcentajeGastos = percentage(porcentajeGastosInput, "Porcentaje de gastos");
  const porcentajeManoObra = percentage(porcentajeManoObraInput, "Porcentaje de mano de obra");
  const montoGastos = ceilingTen(subtotalMateriales.mul(porcentajeGastos).div(100));
  const baseManoObra = subtotalMateriales.add(montoGastos);
  const montoManoObra = ceilingTen(baseManoObra.mul(porcentajeManoObra).div(100));
  const montoAdicionales = money(adicionales.reduce((total, adicional, index) => {
    const monto = decimal(adicional.monto, `Monto del adicional ${index + 1}`);
    if (monto.isNegative()) throw new Error(`El monto del adicional ${index + 1} no puede ser negativo`);
    return total.add(monto);
  }, new Prisma.Decimal(0)));

  return {
    subtotalMateriales,
    porcentajeGastos,
    montoGastos,
    porcentajeManoObra,
    montoManoObra,
    montoAdicionales,
    total: money(baseManoObra.add(montoManoObra).add(montoAdicionales)),
    subtotales,
  };
}
