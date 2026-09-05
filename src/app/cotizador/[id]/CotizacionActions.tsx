"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export function CotizacionActions({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteQuote() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/cotizaciones/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo eliminar la cotización");
      router.push("/cotizador");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar la cotización");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className={styles.actionsWrap}>
        <a className={styles.downloadButton} href={`/api/cotizaciones/${id}/pdf`} download>
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Descargar PDF
        </a>
        <button className={styles.deleteButton} type="button" onClick={() => setConfirming(true)}>
          <span className="material-symbols-outlined">delete</span>
          Eliminar
        </button>
      </div>
      {confirming && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.confirmModal} role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <span className="material-symbols-outlined">warning</span>
            <h2 id="delete-title">¿Eliminar cotización?</h2>
            <p>Esta acción eliminará también sus materiales y adicionales. No se puede deshacer.</p>
            {error && <p className={styles.deleteError} role="alert">{error}</p>}
            <div>
              <button type="button" disabled={deleting} onClick={() => { setConfirming(false); setError(""); }}>
                Cancelar
              </button>
              <button className={styles.confirmDelete} type="button" disabled={deleting} onClick={deleteQuote}>
                {deleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
