import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const START_MAX_WAIT_MS = 15_000;
const START_TIMEOUT_MS = 10_000;
const START_RETRY_DELAYS_MS = [1_000, 3_000] as const;
const TRANSACTION_START_TIMEOUT = "Unable to start a transaction in the given time";

type StartCatalogSyncOptions = {
  retryDelaysMs?: readonly number[];
  sleep?: (milliseconds: number) => Promise<void>;
};

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function isTransactionStartTimeout(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2028"
    && error.message.includes(TRANSACTION_START_TIMEOUT);
}

async function startCatalogSyncAttempt(sourceUrl: string) {
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
  }, { maxWait: START_MAX_WAIT_MS, timeout: START_TIMEOUT_MS });
}

export async function startCatalogSync(sourceUrl: string, options: StartCatalogSyncOptions = {}) {
  const retryDelaysMs = options.retryDelaysMs ?? START_RETRY_DELAYS_MS;
  const sleep = options.sleep ?? wait;

  for (let attempt = 0; ; attempt++) {
    try {
      return await startCatalogSyncAttempt(sourceUrl);
    } catch (error) {
      const retryDelay = retryDelaysMs[attempt];
      if (!isTransactionStartTimeout(error) || retryDelay === undefined) throw error;
      console.warn(
        `No se pudo iniciar la transacción del catálogo (intento ${attempt + 1}). `
        + `Reintentando en ${retryDelay} ms.`,
      );
      await sleep(retryDelay);
    }
  }
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
