import { fetchAcercoHtml } from "../src/lib/catalogo/acerco/client";
import { parseAcercoListing, parseAcercoProduct } from "../src/lib/catalogo/acerco/parser";

const listingUrl = process.argv[2] ?? "https://acerco.com.ar/productos/";

async function main() {
  console.log(`Descargando listado: ${listingUrl}`);
  const listing = parseAcercoListing(await fetchAcercoHtml(listingUrl), listingUrl);
  console.log(
    `Detectados ${listing.products.length} productos ` +
      `(${listing.products.filter((product) => product.type === "SIMPLE").length} simples, ` +
      `${listing.products.filter((product) => product.type === "VARIABLE").length} variables).`,
  );

  const products = [];
  for (const product of listing.products) {
    console.log(`[${product.type.toLowerCase()}] ${product.name}`);
    products.push(await parseAcercoProduct(await fetchAcercoHtml(product.url), product));
  }

  console.dir(products, { depth: null });
  if (products.some((product) => product.warnings.length > 0)) process.exitCode = 2;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
