import Link from "next/link";

type NavSection = "calendar" | "orders" | "quotes";

export function BottomNav({ active = "orders" }: { active?: NavSection }) {
  return <nav className="bottom-nav">
    <Link className={active === "calendar" ? "active" : ""} href="/calendario"><span className="material-symbols-outlined">calendar_today</span>Calendario</Link>
    <Link className={active === "orders" ? "active" : ""} href="/pedidos"><span className="material-symbols-outlined">assignment</span>Pedidos</Link>
    <Link className={active === "quotes" ? "active" : ""} href="/cotizador"><span className="material-symbols-outlined">request_quote</span>Cotizaciones</Link>
  </nav>;
}
