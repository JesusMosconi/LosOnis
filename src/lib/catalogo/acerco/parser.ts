import * as cheerio from "cheerio";
import { argentinePriceToCents, wooPriceToCents } from "@/lib/catalogo/money";
import { fetchAcercoVariation } from "./client";
import type {
  AcercoCatalogItem,
  AcercoCategory,
  AcercoListingPage,
  AcercoListingProduct,
  AcercoProduct,
} from "./types";

const AJAX_CONCURRENCY = 3;
const MAX_ATTRIBUTE_COMBINATIONS = 500;

type WooVariation = {
  variation_id?: unknown;
  display_price?: unknown;
  sku?: unknown;
  is_in_stock?: unknown;
  attributes?: unknown;
};

function cleanText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function parseAcercoListing(html: string, pageUrl: string): AcercoListingPage {
  const $ = cheerio.load(html);
  const products: AcercoListingProduct[] = [];
  const cards = $("ul.products li.product");
  cards.each((_, element) => {
    const card = $(element);
    const link = card
      .find("a.woocommerce-loop-product__link, h2 a, h3 a, a[href*='/producto/']")
      .first();
    const href = link.attr("href");
    const rawExternalId = card.find("[data-product_id]").first().attr("data-product_id");
    const externalId = rawExternalId && /^\d+$/.test(rawExternalId) ? Number(rawExternalId) : null;
    const name = cleanText(
      card.find(".woocommerce-loop-product__title, h2, h3").first().text() || link.text(),
    );
    if (!href || !name) return;

    const isVariable =
      card.hasClass("product-type-variable") ||
      card.find("a.product_type_variable").length > 0 ||
      cleanText(card.text()).includes("Este producto tiene múltiples variantes") ||
      card.find("a").filter((__, anchor) => cleanText($(anchor).text()) === "Ver producto").length > 0;
    products.push({
      externalId: externalId ?? 0,
      name,
      url: new URL(href, pageUrl).href,
      type: isVariable ? "VARIABLE" : "SIMPLE",
    });
  });
  if (products.length !== cards.length) {
    throw new Error(
      `Se reconocieron ${products.length} de ${cards.length} productos en ${pageUrl}; se cancela para evitar omisiones`,
    );
  }

  const pages = $(".woocommerce-pagination a.page-numbers, a.page-numbers")
    .map((_, anchor) => Number.parseInt(cleanText($(anchor).text()), 10))
    .get()
    .filter(Number.isFinite);
  return { products, totalPages: Math.max(1, ...pages) };
}

function detailProductId($: cheerio.CheerioAPI, fallback: number): number {
  if (fallback > 0) return fallback;
  const candidates = [
    $("form.cart [name='product_id']").first().attr("value"),
    $("form.cart [name='add-to-cart']").first().attr("value"),
    $("button[name='add-to-cart']").first().attr("value"),
    $("form.variations_form").first().attr("data-product_id"),
    $("body").attr("class")?.match(/\bpostid-(\d+)\b/)?.[1],
  ];
  const raw = candidates.find((value) => value && /^\d+$/.test(value));
  if (!raw) throw new Error("No se pudo determinar el ID externo del producto");
  return Number(raw);
}

function categories($: cheerio.CheerioAPI): AcercoCategory[] {
  return $(".product_meta .posted_in a")
    .map((_, anchor) => {
      const url = $(anchor).attr("href");
      if (!url) return null;
      const parsedUrl = new URL(url);
      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      return { name: cleanText($(anchor).text()), slug: parts.at(-1) ?? "", url };
    })
    .get()
    .filter((category): category is AcercoCategory => Boolean(category?.name && category.slug));
}

function variationLabels($: cheerio.CheerioAPI): Map<string, Map<string, string>> {
  const labels = new Map<string, Map<string, string>>();
  $("form.variations_form select[name]").each((_, select) => {
    const name = $(select).attr("name");
    if (!name) return;
    const options = new Map<string, string>();
    $(select).find("option[value]").each((__, option) => {
      const value = $(option).attr("value");
      const label = cleanText($(option).text());
      if (value && label) options.set(value, label);
    });
    labels.set(name, options);
  });
  return labels;
}

function toCatalogItem(
  variation: WooVariation,
  product: AcercoListingProduct,
  labels: Map<string, Map<string, string>>,
): AcercoCatalogItem {
  if (!Number.isInteger(variation.variation_id) || Number(variation.variation_id) <= 0) {
    throw new Error("La variante no contiene variation_id válido");
  }
  const rawAttributes =
    variation.attributes && typeof variation.attributes === "object"
      ? (variation.attributes as Record<string, unknown>)
      : {};
  const attributes = Object.fromEntries(
    Object.entries(rawAttributes).map(([key, value]) => {
      const rawValue = typeof value === "string" ? value : String(value ?? "");
      return [key, labels.get(key)?.get(rawValue) ?? rawValue];
    }),
  );
  const variationId = Number(variation.variation_id);
  const description = Object.values(attributes).filter(Boolean).join(" / ");
  return {
    externalKey: `acerco:variation:${variationId}`,
    variationId,
    name: description ? `${product.name} — ${description}` : product.name,
    sku: typeof variation.sku === "string" && variation.sku.trim() ? variation.sku.trim() : null,
    attributes,
    priceInCents: wooPriceToCents(variation.display_price),
    inStock: typeof variation.is_in_stock === "boolean" ? variation.is_in_stock : null,
  };
}

function attributeSelections(labels: Map<string, Map<string, string>>) {
  let selections: Record<string, string>[] = [{}];
  for (const [attribute, options] of labels) {
    selections = selections.flatMap((selection) =>
      [...options.keys()].map((value) => ({ ...selection, [attribute]: value })),
    );
    if (selections.length > MAX_ATTRIBUTE_COMBINATIONS) {
      throw new Error(`El producto supera ${MAX_ATTRIBUTE_COMBINATIONS} combinaciones`);
    }
  }
  return selections;
}

async function mapSettled<T, R>(values: T[], mapper: (value: T) => Promise<R>) {
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
  await Promise.all(
    Array.from({ length: Math.min(AJAX_CONCURRENCY, values.length) }, () => worker()),
  );
  return results;
}

async function ajaxVariations(
  product: AcercoListingProduct,
  productId: number,
  labels: Map<string, Map<string, string>>,
) {
  const selections = attributeSelections(labels);
  const settled = await mapSettled(selections, (selection) =>
    fetchAcercoVariation(product.url, productId, selection),
  );
  const items = new Map<number, AcercoCatalogItem>();
  const warnings: string[] = [];
  for (const result of settled) {
    if (result.status === "rejected") {
      warnings.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      continue;
    }
    if (!result.value || typeof result.value !== "object") continue;
    try {
      const item = toCatalogItem(result.value as WooVariation, product, labels);
      items.set(item.variationId as number, item);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (items.size === 0) warnings.push("El endpoint AJAX no devolvió variantes válidas");
  return { items: [...items.values()], warnings };
}

export async function parseAcercoProduct(
  html: string,
  product: AcercoListingProduct,
): Promise<AcercoProduct> {
  const $ = cheerio.load(html);
  const externalId = detailProductId($, product.externalId);
  product = { ...product, externalId };
  const name = cleanText($("h1.product_title, h1.entry-title").first().text()) || product.name;
  const sku = cleanText($(".product_meta .sku").first().text()) || null;
  const base = { ...product, name, sku, categories: categories($) };

  if (product.type === "SIMPLE") {
    const priceText = $(
      ".elementor-jet-single-price .price ins .woocommerce-Price-amount, " +
        ".elementor-jet-single-price .price .woocommerce-Price-amount, " +
        ".summary .price ins .woocommerce-Price-amount, " +
        ".summary .price .woocommerce-Price-amount",
    )
      .last()
      .text();
    if (!priceText) throw new Error("Producto simple sin precio");
    return {
      ...base,
      items: [{
        externalKey: `acerco:product:${product.externalId}`,
        variationId: null,
        name,
        sku,
        attributes: {},
        priceInCents: argentinePriceToCents(priceText),
        inStock: $(".stock.out-of-stock").length ? false : $(".stock.in-stock").length ? true : null,
      }],
      warnings: [],
    };
  }

  const form = $("form.variations_form").first();
  const labels = variationLabels($);
  const raw = form.attr("data-product_variations");
  if (raw && raw !== "false") {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("data-product_variations no es un array");
    return {
      ...base,
      items: parsed.map((variation) => toCatalogItem(variation as WooVariation, product, labels)),
      warnings: [],
    };
  }

  const productId = Number(form.attr("data-product_id"));
  if (!Number.isInteger(productId) || productId <= 0 || labels.size === 0) {
    throw new Error("Producto variable sin JSON, product_id u opciones válidas");
  }
  const ajax = await ajaxVariations(product, productId, labels);
  return { ...base, ...ajax };
}

export function listingPageUrl(startUrl: string, page: number): string {
  if (page === 1) return startUrl;
  const url = new URL(startUrl);
  url.pathname = `${url.pathname.replace(/\/page\/\d+\/?$/, "/").replace(/\/$/, "")}/page/${page}/`;
  return url.href;
}
