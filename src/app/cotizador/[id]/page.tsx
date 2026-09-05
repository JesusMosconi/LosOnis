import { notFound, redirect } from "next/navigation";
import { BackHeader } from "@/components/AppHeader";
import { CotizadorForm, type CotizadorFormData } from "@/components/cotizador/CotizadorForm";
import { prisma } from "@/lib/prisma";
import { canAccessCotizador, getSession } from "@/lib/session";
import { CotizacionActions } from "./CotizacionActions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAccessCotizador(session)) redirect("/calendario");
  const { id } = await params;
  const quote = await prisma.cotizacion.findUnique({
    where: { id },
    include: {
      items: { orderBy: { orden: "asc" } },
      adicionales: { orderBy: { orden: "asc" } },
    },
  });
  if (!quote) notFound();

  const cotizacion: CotizadorFormData = {
    titulo: quote.titulo,
    clienteNombre: quote.clienteNombre,
    clienteTelefono: quote.clienteTelefono ?? "",
    descripcion: quote.descripcion,
    notas: quote.notas,
    validaHasta: quote.validaHasta?.toISOString().slice(0, 10) ?? null,
    estado: quote.estado as "BORRADOR" | "FINALIZADA",
    porcentajeGastos: quote.porcentajeGastos.toString(),
    porcentajeManoObra: quote.porcentajeManoObra.toString(),
    items: quote.items.map((item) => ({
      id: item.id,
      itemCatalogoId: item.itemCatalogoId,
      nombre: item.nombre,
      sku: item.sku,
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.cantidad.toString(),
      precioUnitario: item.precioUnitario.toFixed(2),
    })),
    adicionales: quote.adicionales.map((adicional) => ({
      id: adicional.id,
      descripcion: adicional.descripcion,
      monto: adicional.monto.toFixed(2),
    })),
  };

  return (
    <>
      <BackHeader title={quote.titulo} href="/cotizador" />
      <CotizacionActions id={quote.id} />
      <CotizadorForm id={quote.id} cotizacion={cotizacion} />
    </>
  );
}
