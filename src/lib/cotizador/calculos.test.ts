import assert from "node:assert/strict";
import test from "node:test";
import { calcularCotizacion } from "./calculos";

test("calcula materiales, gastos y mano de obra en el orden acordado", () => {
  const result = calcularCotizacion(
    [
      { cantidad: "2", precioUnitario: "100.00" },
      { cantidad: "1.5", precioUnitario: "50.00" },
    ],
    "10",
    "20",
  );

  assert.equal(result.subtotalMateriales.toString(), "275");
  assert.equal(result.montoGastos.toString(), "30");
  assert.equal(result.montoManoObra.toString(), "70");
  assert.equal(result.montoAdicionales.toString(), "0");
  assert.equal(result.total.toString(), "375");
  assert.deepEqual(result.subtotales.map(String), ["200", "75"]);
});

test("mantiene subtotales a dos decimales y redondea gastos y mano de obra hacia arriba a $10", () => {
  const result = calcularCotizacion(
    [{ cantidad: "0.333", precioUnitario: "10.01" }],
    "7.5",
    "12.5",
  );

  assert.equal(result.subtotalMateriales.toFixed(2), "3.33");
  assert.equal(result.montoGastos.toFixed(2), "10.00");
  assert.equal(result.montoManoObra.toFixed(2), "10.00");
  assert.equal(result.total.toFixed(2), "23.33");
});

test("suma los adicionales después de la mano de obra", () => {
  const result = calcularCotizacion(
    [{ cantidad: "2", precioUnitario: "100" }],
    "10",
    "20",
    [{ monto: "35.50" }, { monto: 4.5 }],
  );

  assert.equal(result.subtotalMateriales.toFixed(2), "200.00");
  assert.equal(result.montoGastos.toFixed(2), "20.00");
  assert.equal(result.montoManoObra.toFixed(2), "50.00");
  assert.equal(result.montoAdicionales.toFixed(2), "40.00");
  assert.equal(result.total.toFixed(2), "310.00");
});

test("sin adicionales mantiene montoAdicionales en cero", () => {
  const result = calcularCotizacion([{ cantidad: 1, precioUnitario: 100 }], 0, 0);
  assert.equal(result.montoAdicionales.toFixed(2), "0.00");
  assert.equal(result.total.toFixed(2), "100.00");
});

test("rechaza cantidades, precios y porcentajes inválidos", () => {
  assert.throws(() => calcularCotizacion([{ cantidad: 0, precioUnitario: 1 }], 0, 0));
  assert.throws(() => calcularCotizacion([{ cantidad: 1, precioUnitario: -1 }], 0, 0));
  assert.throws(() => calcularCotizacion([{ cantidad: 1, precioUnitario: 1 }], -1, 0));
  assert.throws(() => calcularCotizacion([{ cantidad: 1, precioUnitario: 1 }], 0, 0, [{ monto: -1 }]));
});
