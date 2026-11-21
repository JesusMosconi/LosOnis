import Link from "next/link";
import { canAccessCotizador, getSession } from "@/lib/session";

type NavSection = "orders" | "quotes";

export async function BottomNav({ active = "orders" }: { active?: NavSection }) {
  const session = await getSession();
  return <nav className="bottom-nav">
    <Link className={active === "orders" ? "active" : ""} href="/pedidos"><span className="material-symbols-outlined">assignment</span>Pedidos</Link>
    {canAccessCotizador(session) && <Link className={active === "quotes" ? "active" : ""} href="/cotizador"><span className="material-symbols-outlined">request_quote</span>Cotizaciones</Link>}
  </nav>;
}
