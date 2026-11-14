import assert from "node:assert/strict";
import test from "node:test";
import { pdfVariantFromUrl } from "./pdf-options";

test("keeps the existing PDF download detailed by default", () => {
  assert.equal(pdfVariantFromUrl("http://localhost/api/cotizaciones/1/pdf"), "detailed");
});

test("selects the summary PDF only for the explicit variant", () => {
  assert.equal(pdfVariantFromUrl("http://localhost/api/cotizaciones/1/pdf?variant=summary"), "summary");
  assert.equal(pdfVariantFromUrl("http://localhost/api/cotizaciones/1/pdf?variant=unexpected"), "detailed");
});
