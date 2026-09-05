import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { prisma } from "@/lib/prisma";
import { canAccessCotizador, getSession } from "@/lib/session";
import { CotizacionesList } from "./CotizacionesList";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ creada?: string; actualizada?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAccessCotizador(session)) redirect("/calendario");
  const { creada, actualizada } = await searchParams;
  const rows = await prisma.cotizacion.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      numero: true,
      titulo: true,
      clienteNombre: true,
      estado: true,
      total: true,
      createdAt: true,
    },
  });
  const cotizaciones = rows.map((quote) => ({
    ...quote,
    total: quote.total.toString(),
    createdAt: quote.createdAt.toISOString(),
  }));

  return (
    <>
      <AppHeader />
      <main className="orders-main">
        <CotizacionesList
          cotizaciones={cotizaciones}
          savedId={creada ?? actualizada}
          savedAction={actualizada ? "updated" : creada ? "created" : undefined}
        />
      </main>
      <BottomNav active="quotes" />
    </>
  );
}
