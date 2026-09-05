import { prisma } from "@/lib/prisma";

export async function startCatalogSync(sourceUrl: string) {
  return prisma.$transaction(async (tx) => {
    // Transaction-scoped: compatible with a pooled Neon connection. Only held
    // while checking/creating the run, never during downloads.
    const [lock] = await tx.$queryRaw<{ acquired: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(732041, 1) AS acquired
    `;
    if (!lock.acquired) throw new Error("Otra sincronización está iniciándose");
    const active = await tx.sincronizacionCatalogo.findFirst({
      where: { estado: "EN_PROCESO" },
      select: { id: true },
    });
    if (active) {
      throw new Error(`Ya hay una sincronización EN_PROCESO: ${active.id}. Verificar su ejecución antes de cerrarla.`);
    }
    return tx.sincronizacionCatalogo.create({ data: { urlOrigen: sourceUrl } });
  });
}

// Call only after the owning process has stopped. Never replaces a completed
// result, and preserves the last checkpoint and any previously recorded errors.
export async function finalizeInterruptedCatalogSync(id: string) {
  return prisma.$executeRaw`
    UPDATE "SincronizacionCatalogo"
    SET "estado" = 'FALLIDA', "finalizadaEn" = NOW(), "errores" = "errores" + 1,
        "detalleError" = concat_ws(E'\n', NULLIF("detalleError", ''),
          'Ejecución interrumpida antes de finalizar (cancelación, timeout o salida del proceso).')
    WHERE "id" = ${id} AND "estado" = 'EN_PROCESO'
  `;
}
