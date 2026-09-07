"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

type P = {
  id: string;
  nombre: string;
  tipoTrabajo: string;
  descripcion: string | null;
  fechaConfirmacion: string;
  montoTotal: string;
  estado: "EN_PROCESO" | "ENTREGADO";
};

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const monthLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
const monthKey = (value: string) => new Date(value).toISOString().slice(0, 7);

export function PedidosList({ pedidos }: { pedidos: P[] }) {
  const [q, setQ] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const gridRef = useRef<HTMLElement>(null);
  const previousPositions = useRef(new Map<string, DOMRect>());
  const animations = useRef<Animation[]>([]);
  const filterChanged = useRef(false);

  function capturePositions() {
    previousPositions.current.clear();
    gridRef.current?.querySelectorAll<HTMLElement>("[data-order-id]").forEach(card => {
      previousPositions.current.set(card.dataset.orderId!, card.getBoundingClientRect());
    });
    animations.current.forEach(animation => animation.cancel());
    animations.current = [];
    filterChanged.current = true;
  }

  useLayoutEffect(() => {
    if (!filterChanged.current) return;
    filterChanged.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gridRef.current?.querySelectorAll<HTMLElement>("[data-order-id]").forEach(card => {
      const previous = previousPositions.current.get(card.dataset.orderId!);
      const current = card.getBoundingClientRect();
      const keyframes = previous
        ? [{ transform: `translate(${previous.left - current.left}px, ${previous.top - current.top}px)` }, { transform: "translate(0, 0)" }]
        : [{ opacity: 0, transform: "translateY(6px)" }, { opacity: getComputedStyle(card).opacity, transform: "translateY(0)" }];
      animations.current.push(card.animate(keyframes, { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" }));
    });
    return () => {
      animations.current.forEach(animation => animation.cancel());
      animations.current = [];
    };
  }, [q, month, status]);

  const months = useMemo(() => [...new Set(pedidos.map(p => monthKey(p.fechaConfirmacion)))]
    .sort((a, b) => b.localeCompare(a))
    .map(value => {
      const parts = monthLabel.formatToParts(new Date(`${value}-01T00:00:00Z`));
      const label = `${parts.find(part => part.type === "month")!.value} ${parts.find(part => part.type === "year")!.value}`;
      return { value, label: label.charAt(0).toLocaleUpperCase("es") + label.slice(1) };
    }), [pedidos]);

  const shown = pedidos.filter(p =>
    p.nombre.toLocaleLowerCase("es").includes(q.toLocaleLowerCase("es")) &&
    (!month || monthKey(p.fechaConfirmacion) === month) &&
    (!status || p.estado === status));
  const total = shown.reduce((sum, p) => sum + Math.round(Number(p.montoTotal) * 100), 0) / 100;

  return <>
    <section className="orders-tools">
      <div className="search">
        <span className="material-symbols-outlined">search</span>
        <input value={q} onChange={e => { capturePositions(); setQ(e.target.value); }} placeholder="Buscar pedidos..." />
      </div>
      <Link className="new-order" href="/pedidos/nuevo"><span className="material-symbols-outlined">add</span>Nuevo pedido</Link>
    </section>
    <section className="orders-filters" aria-label="Filtros de pedidos">
      <label>
        Mes
        <select value={month} onChange={e => { capturePositions(); setMonth(e.target.value); }}>
          <option value="">Todos los meses</option>
          {months.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label>
        Estado
        <select value={status} onChange={e => { capturePositions(); setStatus(e.target.value); }}>
          <option value="">Todos</option>
          <option value="EN_PROCESO">En proceso</option>
          <option value="ENTREGADO">Entregado</option>
        </select>
      </label>
      <div className="orders-summary" aria-live="polite" aria-atomic="true">
        <span>Total de pedidos visibles</span>
        <strong>{money.format(total)}</strong>
      </div>
    </section>
    <section className="orders-grid" ref={gridRef}>
      {shown.map(p => <Link href={`/pedidos/${p.id}`} className={`order-card ${p.estado === "ENTREGADO" ? "delivered" : ""}`} key={p.id} data-order-id={p.id}>
        <i />
        <div>
          <header>
            <h2>{p.nombre}</h2>
            <span className={`status ${p.estado.toLowerCase()}`}>{p.estado === "ENTREGADO" ? "Entregado" : "En proceso"}</span>
          </header>
          <p>{p.descripcion || p.tipoTrabajo}</p>
          <footer>
            <span><span className="material-symbols-outlined">{p.estado === "ENTREGADO" ? "check_circle" : "calendar_today"}</span>{date.format(new Date(p.fechaConfirmacion))}</span>
            <strong>{money.format(Number(p.montoTotal))}</strong>
          </footer>
        </div>
      </Link>)}
    </section>
    {!shown.length && <p className="empty">No hay pedidos que coincidan con la búsqueda y los filtros.</p>}
  </>;
}
