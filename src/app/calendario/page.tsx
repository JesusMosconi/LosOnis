import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { CalendarNav } from "@/components/CalendarNav";
import { PedidosSidebar } from "@/components/PedidosSidebar";
import { MonthCalendar } from "./MonthCalendar";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  if (!await getSession()) redirect("/login");
  const q = (await searchParams).mes, now = new Date(), match = q?.match(/^(\d{4})-(\d{2})$/),
    year = match ? Number(match[1]) : now.getFullYear(),
    month = match ? Number(match[2]) : now.getMonth() + 1;
  const desde = new Date(`${year}-${String(month).padStart(2, "0")}-01T12:00:00Z`),
    hasta = new Date(Date.UTC(year, month, 0, 12));
  const [rows, pedidos] = await Promise.all([
    prisma.tarea.findMany({
      where: { fecha: { gte: desde, lte: hasta } },
      select: { id: true, fecha: true, estado: true, pedido: { select: { nombre: true } } },
    }),
    prisma.pedido.findMany({
      select: { id: true, nombre: true, fechaConfirmacion: true, estado: true, montoTotal: true },
      orderBy: { fechaConfirmacion: "desc" },
    }),
  ]);
  const totalMes = pedidos.reduce((total, pedido) =>
    pedido.fechaConfirmacion >= desde && pedido.fechaConfirmacion <= hasta
      ? total.add(pedido.montoTotal)
      : total, new Prisma.Decimal(0));

  return <>
    <AppHeader />
    <main className="calendar-layout">
      <PedidosSidebar pedidos={pedidos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        fechaConfirmacion: p.fechaConfirmacion.toISOString(),
        estado: p.estado,
      }))} />
      <MonthCalendar
        year={year}
        month={month}
        totalMes={money.format(totalMes.toNumber())}
        tareas={rows.map(t => ({ ...t, fecha: t.fecha.toISOString() }))}
      />
    </main>
    <CalendarNav active="calendar" />
  </>;
}
