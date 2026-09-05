import "dotenv/config";
import { appendFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";
import { syncAcercoCatalog } from "../src/lib/catalogo/sync-catalogo";

function sourceUrlFromArgs() {
  const argument = process.argv.slice(2).find((value) => value.startsWith("--url="));
  return argument?.slice("--url=".length);
}

async function main() {
  const sourceUrl = sourceUrlFromArgs();
  console.log(`Sincronizando catálogo desde ${sourceUrl ?? "https://acerco.com.ar/productos/"}`);
  const result = await syncAcercoCatalog(sourceUrl, async (syncId) => {
    if (process.env.GITHUB_OUTPUT) {
      await appendFile(process.env.GITHUB_OUTPUT, `sync-id=${syncId}\n`);
    }
  });
  console.dir(result, { depth: null });
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `Catálogo ACERCO: **${result.status}**\n\n` +
      `Sincronización: \`${result.syncId}\`\n\n` +
      `${result.pagesProcessed} páginas · ${result.productsProcessed} productos · ${result.itemsProcessed} ítems · ${result.errors.length} errores\n`);
  }
  if (result.status !== "COMPLETADA") process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
