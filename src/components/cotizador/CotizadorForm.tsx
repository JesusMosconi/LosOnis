"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./CotizadorForm.module.css";

type CatalogItem = {
  id: string;
  name: string;
  sku: string | null;
  price: string;
};

type QuoteItem = {
  key: string;
  itemCatalogoId?: string;
  nombre: string;
  sku?: string | null;
  descripcion?: string | null;
  unidad?: string;
  cantidad: string;
  precioUnitario: string;
};

type QuoteAdditional = {
  key: string;
  descripcion: string;
  monto: string;
};

export type CotizadorFormData = {
  titulo: string;
  clienteNombre: string;
  clienteTelefono: string;
  descripcion: string | null;
  notas: string | null;
  validaHasta: string | null;
  estado: "BORRADOR" | "FINALIZADA";
  porcentajeGastos: string;
  porcentajeManoObra: string;
  items: Array<{
    id: string;
    itemCatalogoId: string | null;
    nombre: string;
    sku: string | null;
    descripcion: string | null;
    unidad: string | null;
    cantidad: string;
    precioUnitario: string;
  }>;
  adicionales: Array<{
    id: string;
    descripcion: string;
    monto: string;
  }>;
};

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const ceilingTen = (value: number) => Math.ceil(value / 10) * 10;

export function CotizadorForm({ cotizacion, id }: { cotizacion?: CotizadorFormData; id?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [items, setItems] = useState<QuoteItem[]>(() => cotizacion?.items.map((item) => ({
    key: item.id,
    itemCatalogoId: item.itemCatalogoId ?? undefined,
    nombre: item.nombre,
    sku: item.sku,
    descripcion: item.descripcion,
    unidad: item.unidad ?? undefined,
    cantidad: item.cantidad,
    precioUnitario: item.precioUnitario,
  })) ?? []);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualError, setManualError] = useState("");
  const [porcentajeGastos, setPorcentajeGastos] = useState(cotizacion?.porcentajeGastos ?? "20");
  const [porcentajeManoObra, setPorcentajeManoObra] = useState(cotizacion?.porcentajeManoObra ?? "80");
  const [titulo, setTitulo] = useState(cotizacion?.titulo ?? "");
  const [clienteNombre, setClienteNombre] = useState(cotizacion?.clienteNombre ?? "");
  const [clienteTelefono, setClienteTelefono] = useState(cotizacion?.clienteTelefono ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [adicionales, setAdicionales] = useState<QuoteAdditional[]>(() =>
    cotizacion?.adicionales.map((adicional) => ({ key: adicional.id, ...adicional })) ?? []);

  useEffect(() => {
    const term = query.trim();
    if (!term) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const response = await fetch(`/api/catalogo?q=${encodeURIComponent(term)}&limit=12`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudo buscar en el catálogo");
        const data = (await response.json()) as { items: CatalogItem[] };
        setResults(data.items);
      } catch (error) {
        if (!controller.signal.aborted) {
          setResults([]);
          setSearchError(error instanceof Error ? error.message : "No se pudo buscar en el catálogo");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const totals = useMemo(() => {
    const subtotalMateriales = roundMoney(items.reduce((total, item) => {
      const cantidad = Number(item.cantidad);
      const precio = Number(item.precioUnitario);
      const lineSubtotal = Number.isFinite(cantidad) && Number.isFinite(precio)
        ? roundMoney(cantidad * precio)
        : 0;
      return total + lineSubtotal;
    }, 0));
    const gastos = Math.max(0, Number(porcentajeGastos) || 0);
    const manoObra = Math.max(0, Number(porcentajeManoObra) || 0);
    const montoGastos = ceilingTen(subtotalMateriales * gastos / 100);
    const baseManoObra = subtotalMateriales + montoGastos;
    const montoManoObra = ceilingTen(baseManoObra * manoObra / 100);
    const montoAdicionales = roundMoney(adicionales.reduce((sum, adicional) => {
      const monto = Number(adicional.monto);
      return sum + (Number.isFinite(monto) && monto >= 0 ? monto : 0);
    }, 0));
    const total = roundMoney(baseManoObra + montoManoObra + montoAdicionales);
    return { subtotalMateriales, montoGastos, montoManoObra, montoAdicionales, total };
  }, [items, porcentajeGastos, porcentajeManoObra, adicionales]);

  function addCatalogItem(catalogItem: CatalogItem) {
    setItems((current) => {
      const existing = current.find((item) => item.itemCatalogoId === catalogItem.id);
      if (existing) {
        return current.map((item) => item.key === existing.key
          ? { ...item, cantidad: String((Number(item.cantidad) || 0) + 1) }
          : item);
      }
      return [...current, {
        key: `catalog-${catalogItem.id}`,
        itemCatalogoId: catalogItem.id,
        nombre: catalogItem.name,
        sku: catalogItem.sku,
        cantidad: "1",
        precioUnitario: catalogItem.price,
      }];
    });
    setQuery("");
    setResults([]);
  }

  function changeQuery(value: string) {
    setQuery(value);
    setResults([]);
    setSearchError("");
    if (!value.trim()) {
      setSearching(false);
    }
  }

  function updateQuantity(key: string, cantidad: string) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, cantidad } : item));
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function updatePercentage(value: string, setter: (next: string) => void) {
    if (value === "" || Number(value) >= 0) setter(value);
  }

  function addAdditional() {
    setAdicionales((current) => [...current, {
      key: `additional-${crypto.randomUUID()}`,
      descripcion: "",
      monto: "0",
    }]);
  }

  function updateAdditional(key: string, field: "descripcion" | "monto", value: string) {
    if (field === "monto" && value !== "" && Number(value) < 0) return;
    setAdicionales((current) => current.map((adicional) =>
      adicional.key === key ? { ...adicional, [field]: value } : adicional));
  }

  function removeAdditional(key: string) {
    setAdicionales((current) => current.filter((adicional) => adicional.key !== key));
  }

  function addManualItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const nombre = String(data.get("nombre") ?? "").trim();
    const unidad = String(data.get("unidad") ?? "").trim();
    const cantidad = String(data.get("cantidad") ?? "");
    const precioUnitario = String(data.get("precioUnitario") ?? "");
    if (!nombre || !(Number(cantidad) > 0) || !(Number(precioUnitario) >= 0)) {
      setManualError("Completá nombre, cantidad y precio con valores válidos.");
      return;
    }
    setItems((current) => [...current, {
      key: `manual-${crypto.randomUUID()}`,
      nombre,
      unidad: unidad || undefined,
      cantidad,
      precioUnitario,
    }]);
    setManualError("");
    setManualOpen(false);
    form.reset();
  }

  async function saveQuote() {
    if (!clienteNombre.trim()) {
      setError("Ingresá el nombre del cliente.");
      return;
    }
    if (items.length === 0) {
      setError("Agregá al menos un material.");
      return;
    }
    if (adicionales.some((adicional) => Number(adicional.monto) > 0 && !adicional.descripcion.trim())) {
      setError("Ingresá una descripción para cada adicional con monto mayor a cero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(id ? `/api/cotizaciones/${id}` : "/api/cotizaciones", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim() || (id ? cotizacion?.titulo : null),
          clienteNombre,
          clienteTelefono,
          descripcion: cotizacion?.descripcion ?? null,
          notas: cotizacion?.notas ?? null,
          validaHasta: cotizacion?.validaHasta ?? null,
          estado: cotizacion?.estado ?? "BORRADOR",
          porcentajeGastos,
          porcentajeManoObra,
          items: items.map(({ itemCatalogoId, nombre, sku, descripcion, unidad, cantidad, precioUnitario }) => ({
            itemCatalogoId,
            nombre,
            sku,
            descripcion,
            unidad,
            cantidad,
            precioUnitario,
          })),
          adicionales: adicionales.map(({ descripcion, monto }) => ({ descripcion, monto })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la cotización");
      const resultId = encodeURIComponent(String(data.id));
      router.push(id ? `/cotizador?actualizada=${resultId}` : `/cotizador?creada=${resultId}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar la cotización");
      setSaving(false);
    }
  }

  return (
    <main className={styles.main}>
      <section className={`${styles.card} ${styles.quoteData}`}>
        <h2>Datos de la cotización</h2>
        <label>
          Nombre del cliente
          <input
            value={clienteNombre}
            onChange={(event) => setClienteNombre(event.target.value)}
            placeholder="Ingresar nombre"
            required
          />
        </label>
        <label>
          Teléfono
          <input
            type="tel"
            value={clienteTelefono}
            onChange={(event) => setClienteTelefono(event.target.value)}
            placeholder="Ingresar teléfono"
          />
        </label>
        <label>
          Título
          <input
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Se genera automáticamente si lo dejás vacío"
          />
        </label>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <h2>Materiales</h2>
            <p>Buscá en el catálogo o cargá uno manualmente.</p>
          </div>
          <button className={styles.manualToggle} type="button" onClick={() => setManualOpen((open) => !open)}>
            <span className="material-symbols-outlined">add</span>
            Manual
          </button>
        </div>

        {manualOpen && (
          <form className={styles.manualForm} onSubmit={addManualItem}>
            <div className={styles.manualHeader}>
              <h3>Material manual</h3>
              <button type="button" aria-label="Cerrar carga manual" onClick={() => setManualOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <label>
              Nombre
              <input name="nombre" placeholder="Ej. Disco de corte" required />
            </label>
            <div className={styles.manualGrid}>
              <label>
                Descripción
                <input name="unidad" maxLength={200} placeholder="Ej. medidas, terminación o detalle" />
              </label>
              <label>
                Cantidad
                <input name="cantidad" type="number" inputMode="decimal" min="0" step="1" defaultValue="1" required />
              </label>
            </div>
            <label>
              Precio unitario
              <input name="precioUnitario" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00" required />
            </label>
            {manualError && <p className={styles.error}>{manualError}</p>}
            <button className={styles.addManual} type="submit">
              <span className="material-symbols-outlined">add_circle</span>
              Agregar material
            </button>
          </form>
        )}

        <div className={styles.searchBox}>
          <span className="material-symbols-outlined">search</span>
          <input
            aria-label="Buscar materiales"
            autoComplete="off"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder="Buscar por nombre o SKU..."
          />
          {searching && <span className={styles.spinner} aria-label="Buscando" />}
        </div>

        {(results.length > 0 || searchError || (!searching && query.trim() && results.length === 0)) && (
          <div className={styles.results} aria-live="polite">
            {searchError && <p className={styles.error}>{searchError}</p>}
            {!searchError && !searching && results.length === 0 && <p className={styles.noResults}>No encontramos materiales.</p>}
            {results.map((result) => (
              <button type="button" className={styles.result} key={result.id} onClick={() => addCatalogItem(result)}>
                <span className={styles.resultInfo}>
                  <strong>{result.name}</strong>
                  <small>{result.sku ? `SKU ${result.sku}` : "Sin SKU"}</small>
                </span>
                <span className={styles.resultPrice}>{money.format(Number(result.price))}</span>
                <span className="material-symbols-outlined">add_circle</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.listHeading}>
          <h2>Ítems agregados</h2>
          <span>{items.length}</span>
        </div>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className="material-symbols-outlined">inventory_2</span>
            <p>Todavía no agregaste materiales.</p>
          </div>
        ) : (
          <div className={styles.itemList}>
            {items.map((item) => (
              <article className={styles.item} key={item.key}>
                <div className={styles.itemTop}>
                  <div>
                    <strong>{item.nombre}</strong>
                    <small>{item.sku ? `SKU ${item.sku}` : item.unidad || "Material manual"}</small>
                  </div>
                  <button type="button" aria-label={`Quitar ${item.nombre}`} onClick={() => removeItem(item.key)}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div className={styles.itemBottom}>
                  <label>
                    Cantidad
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="1"
                      value={item.cantidad}
                      onChange={(event) => updateQuantity(item.key, event.target.value)}
                    />
                  </label>
                  <div>
                    <span>{money.format(Number(item.precioUnitario))} c/u</span>
                    <strong>{money.format((Number(item.cantidad) || 0) * Number(item.precioUnitario))}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={`${styles.card} ${styles.additionalsCard}`}>
        <div className={styles.additionalHeading}>
          <div>
            <h2>Adicionales</h2>
            <p>Flete, imprevistos, emergencias u otras variaciones.</p>
          </div>
          <button type="button" onClick={addAdditional}>
            <span className="material-symbols-outlined">add</span>
            Agregar adicional
          </button>
        </div>
        {adicionales.length === 0 ? (
          <p className={styles.noAdditionals}>No hay adicionales cargados.</p>
        ) : (
          <div className={styles.additionalList}>
            {adicionales.map((adicional, index) => (
              <div className={styles.additionalRow} key={adicional.key}>
                <label>
                  Descripción
                  <input
                    value={adicional.descripcion}
                    maxLength={200}
                    onChange={(event) => updateAdditional(adicional.key, "descripcion", event.target.value)}
                    placeholder={`Adicional ${index + 1}`}
                  />
                </label>
                <label>
                  Monto
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    value={adicional.monto}
                    onChange={(event) => updateAdditional(adicional.key, "monto", event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Quitar adicional ${index + 1}`}
                  onClick={() => removeAdditional(adicional.key)}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={`${styles.card} ${styles.totalsCard}`}>
        <h2>Totales</h2>
        <div className={styles.percentageGrid}>
          <label>
            % Insumos y Viáticos
            <input
              name="porcentajeGastos"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={porcentajeGastos}
              onChange={(event) => updatePercentage(event.target.value, setPorcentajeGastos)}
            />
          </label>
          <label>
            % Mano de obra
            <input
              name="porcentajeManoObra"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={porcentajeManoObra}
              onChange={(event) => updatePercentage(event.target.value, setPorcentajeManoObra)}
            />
          </label>
        </div>
        <div className={styles.totalsList}>
          <div><span>Subtotal materiales</span><strong>{money.format(totals.subtotalMateriales)}</strong></div>
          <div><span>Insumos y Viáticos</span><strong>{money.format(totals.montoGastos)}</strong></div>
          <div><span>Monto mano de obra</span><strong>{money.format(totals.montoManoObra)}</strong></div>
          <div><span>Adicionales</span><strong>{money.format(totals.montoAdicionales)}</strong></div>
          <div className={styles.grandTotal}><span>Total</span><strong>{money.format(totals.total)}</strong></div>
        </div>
      </section>

      <div className={styles.actionBar}>
        <button type="button" disabled={saving} onClick={saveQuote}>
          <span className="material-symbols-outlined">save</span>
          {saving ? "Guardando…" : id ? "Guardar cambios" : "Guardar cotización"}
        </button>
      </div>
      {error && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={`${styles.feedbackModal} ${styles.errorModal}`} role="alertdialog" aria-modal="true" aria-labelledby="quote-error-title">
            <span className="material-symbols-outlined">error</span>
            <h2 id="quote-error-title">No se pudo guardar</h2>
            <p>{error}</p>
            <button type="button" onClick={() => setError("")}>Volver al formulario</button>
          </section>
        </div>
      )}
    </main>
  );
}
