import assert from "node:assert/strict";
import test from "node:test";
import { parseAcercoProduct } from "./acerco/parser";
import type { AcercoListingProduct } from "./acerco/types";

const product: AcercoListingProduct = {
  externalId: 45375,
  name: "Chapa Cincalum acanalada C-25",
  url: "https://acerco.com.ar/producto/chapa-prueba/",
  type: "SIMPLE",
};

function html(form = "") {
  return `
    <html><body class="postid-45375">
      <h1 class="product_title">Chapa Cincalum acanalada C-25</h1>
      <div class="product_meta"><span class="sku">901026</span></div>
      <div class="summary"><p class="price"><span class="woocommerce-Price-amount">$14.917,51</span></p></div>
      <p class="stock in-stock">Disponible</p>
      ${form}
    </body></html>`;
}

test("convierte cada opción del calculador por metros en un ítem con precio total", async () => {
  const parsed = await parseAcercoProduct(html(`
    <form class="cart">
      <select name="wck[custom_mts]">
        <option value="">Elige una opción</option>
        <option value="2:2 mts">2 mts</option>
        <option value="2.5:2.5 mts">2.5 mts</option>
        <option value="3.5:3.5 mts">3.5 mts</option>
      </select>
    </form>`), product);

  assert.deepEqual(parsed.items.map((item) => ({
    key: item.externalKey,
    name: item.name,
    meters: item.attributes.Metros,
    price: item.priceInCents,
  })), [
    { key: "acerco:calculator:45375:custom_mts:2", name: `${product.name} — 2 mts`, meters: "2 mts", price: 2_983_502 },
    { key: "acerco:calculator:45375:custom_mts:2.5", name: `${product.name} — 2.5 mts`, meters: "2.5 mts", price: 3_729_378 },
    { key: "acerco:calculator:45375:custom_mts:3.5", name: `${product.name} — 3.5 mts`, meters: "3.5 mts", price: 5_221_129 },
  ]);
});

test("mantiene sin cambios los productos simples sin calculador", async () => {
  const parsed = await parseAcercoProduct(html(), product);
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].externalKey, "acerco:product:45375");
  assert.equal(parsed.items[0].priceInCents, 1_491_751);
  assert.deepEqual(parsed.items[0].attributes, {});
});
