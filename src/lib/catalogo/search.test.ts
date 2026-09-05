import assert from "node:assert/strict";
import test from "node:test";
import { catalogSearchScore, catalogSearchTerms, normalizeCatalogSearch } from "./search";

test("normaliza medidas escritas sin espacios", () => {
  assert.deepEqual(catalogSearchTerms("80x100 x 2mm"), ["80", "100", "2", "mm"]);
});

test("normaliza acentos, mayúsculas y espacios", () => {
  assert.equal(normalizeCatalogSearch("  ÁNGULOS   Galvanizados "), "angulos galvanizados");
});

test("prioriza SKU exacto y secuencia exacta de medidas", () => {
  const query = normalizeCatalogSearch("80x100x2");
  assert.equal(catalogSearchScore("otro producto", "80x100x2", query), 0);
  assert.equal(catalogSearchScore("tubo rectangular 80 100 2 mm", null, query), 1);
  assert.equal(catalogSearchScore("tubo 20 100 2 peso 80", null, query), 2);
});
