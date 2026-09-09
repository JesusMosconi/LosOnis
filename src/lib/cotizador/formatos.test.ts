import assert from "node:assert/strict";
import test from "node:test";
import { nombreArchivoCotizacion } from "./formatos";

test("completa con cero el mes y una cotización de un dígito", () => {
  assert.equal(
    nombreArchivoCotizacion(new Date("2026-09-09T12:00:00-03:00"), 8, "Título"),
    "2026-09-08-Titulo.pdf",
  );
});

test("mantiene sin cambios una cotización de tres dígitos", () => {
  assert.equal(
    nombreArchivoCotizacion(new Date("2026-09-09T12:00:00-03:00"), 104, "Título"),
    "2026-09-104-Titulo.pdf",
  );
});
