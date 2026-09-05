import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { finalizeInterruptedCatalogSync } from "../src/lib/catalogo/sync-state";

async function main() {
  const id = process.env.CATALOG_SYNC_ID;
  if (!id) throw new Error("Falta CATALOG_SYNC_ID; indicar la ejecución detenida que se debe cerrar");
  const updated = await finalizeInterruptedCatalogSync(id);
  console.log(`Sincronización ${id}: ${updated ? "interrupción registrada" : "sin cambios (ya finalizada o inexistente)"}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
