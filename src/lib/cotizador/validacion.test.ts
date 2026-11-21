import assert from "node:assert/strict";
import test from "node:test";
import { validateQuoteBody } from "./validacion";

const body = {
  clienteNombre: "Diego",
  titulo: "Portón principal",
  items: [{}],
};

test("requires a meaningful title before saving a quote", () => {
  assert.equal(validateQuoteBody(body).titulo, "Portón principal");
  assert.throws(() => validateQuoteBody({ ...body, titulo: "   " }), /Campo de texto inválido/);
  assert.throws(() => validateQuoteBody({ ...body, titulo: null }), /Campo de texto inválido/);
});
