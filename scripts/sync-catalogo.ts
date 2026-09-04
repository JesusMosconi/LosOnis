import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { syncAcercoCatalog } from "../src/lib/catalogo/sync-catalogo";

function sourceUrlFromArgs() {
  const argument = process.argv.slice(2).find((value) => value.startsWith("--url="));
  return argument?.slice("--url=".length);
}

async function main() {
  const sourceUrl = sourceUrlFromArgs();
  console.log(`Sincronizando catálogo desde ${sourceUrl ?? "https://acerco.com.ar/productos/"}`);
  const result = await syncAcercoCatalog(sourceUrl);
  console.dir(result, { depth: null });
  if (result.status !== "COMPLETADA") process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
