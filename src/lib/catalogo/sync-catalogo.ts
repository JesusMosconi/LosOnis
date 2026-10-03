import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { centsToDecimalString } from "./money";
import { normalizeCatalogSearch } from "./search";
import { fetchAcercoHtml } from "./acerco/client";
import { listingPageUrl, parseAcercoListing, parseAcercoProduct } from "./acerco/parser";
import type { AcercoProduct } from "./acerco/types";
import { startCatalogSync } from "./sync-state";

const DEFAULT_SOURCE_URL = "https://acerco.com.ar/productos/";
const PRODUCT_CONCURRENCY = 2;

export type CatalogSyncResult = {
  syncId: string;
  status: "COMPLETADA" | "PARCIAL" | "FALLIDA";
  pagesProcessed: number;
  productsProcessed: number;
  itemsProcessed: number;
  errors: string[];
};

function isFullCatalogUrl(value: string) {
  const url = new URL(value);
  return url.origin === "https://acerco.com.ar" && url.pathname === "/productos/" && !url.search;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next++;
      try {
        results[index] = { status: "fulfilled", value: await mapper(values[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

async function persistProduct(product: AcercoProduct, synchronizedAt: Date) {
  return prisma.$transaction(async (tx) => {
    const categoryIds: string[] = [];
    for (const category of product.categories) {
      const record = await tx.categoriaCatalogo.upsert({
        where: { proveedor_slug: { proveedor: "ACERCO", slug: category.slug } },
        create: {
          proveedor: "ACERCO",
          nombre: category.name,
          slug: category.slug,
          urlOrigen: category.url,
        },
        update: { nombre: category.name, urlOrigen: category.url },
      });
      categoryIds.push(record.id);
    }

    const parent = await tx.productoCatalogo.upsert({
      where: {
        proveedor_productoExternoId: {
          proveedor: "ACERCO",
          productoExternoId: product.externalId,
        },
      },
      create: {
        proveedor: "ACERCO",
        productoExternoId: product.externalId,
        tipo: product.type,
        nombre: product.name,
        sku: product.sku,
        urlOrigen: product.url,
        ultimaSincronizacion: synchronizedAt,
        ultimoError: product.warnings.join("\n") || null,
        categorias: { connect: categoryIds.map((id) => ({ id })) },
      },
      update: {
        tipo: product.type,
        nombre: product.name,
        sku: product.sku,
        urlOrigen: product.url,
        activo: true,
        ultimaSincronizacion: synchronizedAt,
        ultimoError: product.warnings.join("\n") || null,
        categorias: { set: categoryIds.map((id) => ({ id })) },
      },
    });

    const seenKeys = product.items.map((item) => item.externalKey);
    const existingPrices = new Map(
      (await tx.itemCatalogo.findMany({
        where: { identificadorExterno: { in: seenKeys } },
        select: { identificadorExterno: true, precio: true },
      })).map((item) => [item.identificadorExterno, item.precio]),
    );
    for (const item of product.items) {
      const price = new Prisma.Decimal(centsToDecimalString(item.priceInCents));
      const existingPrice = existingPrices.get(item.externalKey);
      const textoBusqueda = normalizeCatalogSearch(
        [product.name, item.name, item.sku, ...Object.values(item.attributes)].filter(Boolean).join(" "),
      );
      await tx.itemCatalogo.upsert({
        where: { identificadorExterno: item.externalKey },
        create: {
          productoId: parent.id,
          identificadorExterno: item.externalKey,
          varianteExternaId: item.variationId,
          nombre: item.name,
          textoBusqueda,
          sku: item.sku,
          atributos: item.attributes,
          precio: price,
          enStock: item.inStock,
          precioActualizadoEn: synchronizedAt,
          ultimaSincronizacion: synchronizedAt,
        },
        update: {
          productoId: parent.id,
          varianteExternaId: item.variationId,
          nombre: item.name,
          textoBusqueda,
          sku: item.sku,
          atributos: item.attributes,
          precio: price,
          enStock: item.inStock,
          activo: true,
          ultimaSincronizacion: synchronizedAt,
          ...(!existingPrice || !existingPrice.equals(price)
            ? { precioActualizadoEn: synchronizedAt }
            : {}),
        },
      });
    }

    if (product.warnings.length === 0 && seenKeys.length > 0) {
      await tx.itemCatalogo.updateMany({
        where: { productoId: parent.id, identificadorExterno: { notIn: seenKeys } },
        data: { activo: false },
      });
    }
    return { itemCount: seenKeys.length };
  }, { maxWait: 10_000, timeout: 30_000 });
}

export async function syncAcercoCatalog(
  sourceUrl = DEFAULT_SOURCE_URL,
  onStarted?: (syncId: string) => Promise<void>,
): Promise<CatalogSyncResult> {
  const sync = await startCatalogSync(sourceUrl);
  const errors: string[] = [];
  let pagesProcessed = 0;
  let productsProcessed = 0;
  let itemsProcessed = 0;

  async function checkpoint() {
    await prisma.sincronizacionCatalogo.update({
      where: { id: sync.id },
      data: {
        paginasProcesadas: pagesProcessed,
        productosProcesados: productsProcessed,
        itemsProcesados: itemsProcessed,
        errores: errors.length,
        detalleError: errors.join("\n") || null,
      },
    });
    console.log(`[${sync.id}] ${pagesProcessed} páginas, ${productsProcessed} productos, ${itemsProcessed} ítems, ${errors.length} errores`);
  }

  try {
    await onStarted?.(sync.id);
    const firstPage = parseAcercoListing(await fetchAcercoHtml(sourceUrl), sourceUrl);
    if (firstPage.products.length === 0) throw new Error("El listado no devolvió productos");
    const products = new Map(firstPage.products.map((product) => [product.url, product]));
    pagesProcessed = 1;
    await checkpoint();

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const pageUrl = listingPageUrl(sourceUrl, page);
      try {
        const listing = parseAcercoListing(await fetchAcercoHtml(pageUrl), pageUrl);
        if (listing.products.length === 0) throw new Error("El listado no devolvió productos");
        listing.products.forEach((product) => products.set(product.url, product));
        pagesProcessed += 1;
      } catch (error) {
        errors.push(`Listado ${pageUrl}: ${error instanceof Error ? error.message : String(error)}`);
      }
      await checkpoint();
    }
    if (products.size === 0) throw new Error("El listado no devolvió productos");

    const listingProducts = [...products.values()];
    console.log(`[${sync.id}] Listado: ${listingProducts.length} productos en ${pagesProcessed}/${firstPage.totalPages} páginas`);
    const seenProductIds: number[] = [];
    for (let offset = 0; offset < listingProducts.length; offset += PRODUCT_CONCURRENCY) {
      const batch = listingProducts.slice(offset, offset + PRODUCT_CONCURRENCY);
      const productResults = await mapWithConcurrency(
        batch,
        PRODUCT_CONCURRENCY,
        async (listingProduct) => {
          const scraped = await parseAcercoProduct(
            await fetchAcercoHtml(listingProduct.url),
            listingProduct,
          );
          const persisted = await persistProduct(scraped, new Date());
          return { scraped, itemCount: persisted.itemCount };
        },
      );
      for (let index = 0; index < productResults.length; index += 1) {
        const result = productResults[index];
        if (result.status === "rejected") {
          const listingProduct = batch[index];
          errors.push(
            `Producto ${listingProduct.url}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
          );
          continue;
        }
        seenProductIds.push(result.value.scraped.externalId);
        productsProcessed += 1;
        itemsProcessed += result.value.itemCount;
        result.value.scraped.warnings.forEach((warning) =>
          errors.push(`${result.value.scraped.url}: ${warning}`),
        );
      }
      await checkpoint();
    }

    if (errors.length === 0 && isFullCatalogUrl(sourceUrl)) {
      await prisma.productoCatalogo.updateMany({
        where: {
          proveedor: "ACERCO",
          productoExternoId: { notIn: seenProductIds },
        },
        data: { activo: false },
      });
    }

    const status = errors.length === 0 ? "COMPLETADA" : "PARCIAL";
    await prisma.sincronizacionCatalogo.update({
      where: { id: sync.id },
      data: {
        estado: status,
        paginasProcesadas: pagesProcessed,
        productosProcesados: productsProcessed,
        itemsProcesados: itemsProcessed,
        errores: errors.length,
        detalleError: errors.join("\n") || null,
        finalizadaEn: new Date(),
      },
    });
    return { syncId: sync.id, status, pagesProcessed, productsProcessed, itemsProcessed, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    await prisma.sincronizacionCatalogo.update({
      where: { id: sync.id },
      data: {
        estado: "FALLIDA",
        paginasProcesadas: pagesProcessed,
        productosProcesados: productsProcessed,
        itemsProcesados: itemsProcessed,
        errores: errors.length,
        detalleError: errors.join("\n"),
        finalizadaEn: new Date(),
      },
    });
    return {
      syncId: sync.id,
      status: "FALLIDA",
      pagesProcessed,
      productsProcessed,
      itemsProcessed,
      errors,
    };
  }
}
