"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./CotizacionesList.module.css";

export type CotizacionListItem = {
  id: string;
  numero: number;
  titulo: string;
  clienteNombre: string;
  estado: "BORRADOR" | "FINALIZADA" | "ANULADA";
  total: string;
  createdAt: string;
};

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" });
const referenceDate = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

const stateLabel = { BORRADOR: "Cotización", FINALIZADA: "Finalizada", ANULADA: "Anulada" } as const;

export function CotizacionesList({
  cotizaciones,
  savedId,
  savedAction,
}: {
  cotizaciones: CotizacionListItem[];
  savedId?: string;
  savedAction?: "created" | "updated";
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [savedNotice, setSavedNotice] = useState(Boolean(savedId));

  function closeSavedNotice() {
    setSavedNotice(false);
    router.replace("/cotizador", { scroll: false });
  }
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const shown = cotizaciones.filter((quote) =>
    quote.titulo.toLocaleLowerCase("es").includes(normalizedQuery) ||
    quote.clienteNombre.toLocaleLowerCase("es").includes(normalizedQuery));

  return (
    <>
      {savedNotice && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.confirmation} role="dialog" aria-modal="true" aria-labelledby="created-title">
            <span className="material-symbols-outlined">check_circle</span>
            <h2 id="created-title">Cotización {savedAction === "updated" ? "actualizada" : "creada"}</h2>
            <p>La cotización se {savedAction === "updated" ? "actualizó" : "guardó"} correctamente.</p>
            <div className={styles.confirmationActions}>
              <button type="button" onClick={closeSavedNotice}>Salir</button>
              <a href={`/api/cotizaciones/${savedId}/pdf`} download>
                <span className="material-symbols-outlined">picture_as_pdf</span>
                Descargar PDF
              </a>
            </div>
          </section>
        </div>
      )}
      <section className="orders-tools">
        <div className="search">
          <span className="material-symbols-outlined">search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cotizaciones..."
            aria-label="Buscar por título o cliente"
          />
        </div>
        <Link className="new-order" href="/cotizador/nueva">
          <span className="material-symbols-outlined">add</span>
          Nueva cotización
        </Link>
      </section>
      <section className="orders-grid">
        {shown.map((quote) => {
          const finalized = quote.estado === "FINALIZADA";
          const reference = `Cotización #${quote.numero} - ${referenceDate.format(new Date(quote.createdAt))}`;
          const automaticTitle = quote.titulo.startsWith(`Cotización #${quote.numero} - `);
          return (
            <Link
              href={`/cotizador/${quote.id}`}
              className={`order-card ${styles.quoteCard} ${finalized ? "delivered" : styles.draftCard}`}
              key={quote.id}
            >
              <i />
              <div>
                <header>
                  <div className={styles.titleGroup}>
                    <h2>{automaticTitle ? reference : quote.titulo}</h2>
                    {!automaticTitle && <small>{reference}</small>}
                  </div>
                  <span className={`status ${finalized ? "entregado" : styles.quoteStatus}`}>
                    {stateLabel[quote.estado]}
                  </span>
                </header>
                <p>{quote.clienteNombre}</p>
                <footer>
                  <span>
                    <span className="material-symbols-outlined">calendar_today</span>
                    {date.format(new Date(quote.createdAt))}
                  </span>
                  <strong>{money.format(Number(quote.total))}</strong>
                </footer>
              </div>
            </Link>
          );
        })}
      </section>
      {!shown.length && <p className="empty">No hay cotizaciones que coincidan con la búsqueda.</p>}
    </>
  );
}
