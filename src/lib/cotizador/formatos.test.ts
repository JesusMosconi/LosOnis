import assert from "node:assert/strict";
import test from "node:test";
import { formatearCantidad, nombreArchivoCotizacion, parsearCantidad } from "./formatos";

test("parsea cantidades con coma o punto y hasta tres decimales", () => {
  assert.equal(parsearCantidad("0,5"), 0.5);
  assert.equal(parsearCantidad("0.5"), 0.5);
  assert.equal(parsearCantidad("1,25"), 1.25);
  assert.equal(parsearCantidad("2"), 2);
});

test("rechaza cantidades vacías, no positivas o con formato inválido", () => {
  for (const value of ["", "0", "-1", "abc", "1,2345", "1,2,3"]) {
    assert.throws(() => parsearCantidad(value));
  }
  assert.throws(() => parsearCantidad("1000000000"));
});

test("formatea cantidades para es-AR sin ceros sobrantes", () => {
  assert.equal(formatearCantidad("0.5"), "0,5");
  assert.equal(formatearCantidad("2.000"), "2");
  assert.equal(formatearCantidad("1.250"), "1,25");
});

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
