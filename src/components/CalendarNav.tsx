import Link from "next/link";
import { canAccessCotizador, getSession } from "@/lib/session";

export async function CalendarNav({ active }: { active: "calendar" | "orders" | "quotes" }) {
  const session = await getSession();
  return <nav className="bottom-nav">
    <Link className={active === "calendar" ? "active" : ""} href="/calendario"><span className="material-symbols-outlined">calendar_today</span>Calendario</Link>
    <Link className={active === "orders" ? "active" : ""} href="/pedidos"><span className="material-symbols-outlined">assignment</span>Pedidos</Link>
    {canAccessCotizador(session) && <Link className={active === "quotes" ? "active" : ""} href="/cotizador"><span className="material-symbols-outlined">request_quote</span>Cotizaciones</Link>}
  </nav>;
}
