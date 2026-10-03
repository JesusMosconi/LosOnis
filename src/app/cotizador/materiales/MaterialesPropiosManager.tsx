"use client";

import { FormEvent, useState } from "react";
import styles from "./page.module.css";

type Material = { id: string; nombre: string; descripcion: string | null; precioUnitario: string };

export function MaterialesPropiosManager({ initialMaterials }: { initialMaterials: Material[] }) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setError("");
    try {
      const response = await fetch(id ? `/api/materiales-propios/${id}` : "/api/materiales-propios", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.get("nombre"),
          descripcion: data.get("descripcion"),
          precioUnitario: data.get("precioUnitario"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo guardar el material");
      const material = result as Material;
      setMaterials((current) => id
        ? current.map((item) => item.id === id ? material : item).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        : [...current, material].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      setEditingId(null);
      form.reset();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el material");
    } finally {
      setSaving(false);
    }
  }

  async function remove(material: Material) {
    if (!window.confirm(`¿Eliminar "${material.nombre}" de Mis materiales?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/materiales-propios/${material.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No se pudo eliminar el material");
      setMaterials((current) => current.filter((item) => item.id !== material.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el material");
    }
  }

  const fields = (material?: Material) => <>
    <label>Nombre<input name="nombre" defaultValue={material?.nombre} maxLength={200} required /></label>
    <label>Descripción<input name="descripcion" defaultValue={material?.descripcion ?? ""} maxLength={1000} placeholder="Unidad, medida o detalle" /></label>
    <label>Precio unitario<input name="precioUnitario" defaultValue={material?.precioUnitario} type="number" min="0" step="0.01" inputMode="decimal" required /></label>
  </>;

  return <main className={styles.main}>
    <form className={styles.createCard} onSubmit={(event) => submit(event)}>
      <h2>Nuevo material</h2>
      <div className={styles.formGrid}>{fields()}</div>
      <button disabled={saving} type="submit"><span className="material-symbols-outlined">add</span>Agregar</button>
    </form>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <section className={styles.list}>
      <div className={styles.listHeading}><h2>Materiales guardados</h2><span>{materials.length}</span></div>
      {materials.length === 0 && <p className={styles.empty}>Todavía no guardaste materiales frecuentes.</p>}
      {materials.map((material) => editingId === material.id ? (
        <form className={styles.materialCard} key={material.id} onSubmit={(event) => submit(event, material.id)}>
          <div className={styles.formGrid}>{fields(material)}</div>
          <div className={styles.actions}>
            <button disabled={saving} type="submit">Guardar</button>
            <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <article className={styles.materialCard} key={material.id}>
          <div className={styles.materialInfo}>
            <strong>{material.nombre}</strong>
            <small>{material.descripcion || "Sin descripción"}</small>
            <b>{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(material.precioUnitario))}</b>
          </div>
          <div className={styles.iconActions}>
            <button type="button" aria-label={`Editar ${material.nombre}`} onClick={() => setEditingId(material.id)}><span className="material-symbols-outlined">edit</span></button>
            <button type="button" aria-label={`Eliminar ${material.nombre}`} onClick={() => remove(material)}><span className="material-symbols-outlined">delete</span></button>
          </div>
        </article>
      ))}
    </section>
  </main>;
}
