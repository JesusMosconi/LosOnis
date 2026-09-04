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
  assert.equal(result.montoGastos.toString(), "27.5");
  assert.equal(result.montoManoObra.toString(), "60.5");
  assert.equal(result.total.toString(), "363");
  assert.deepEqual(result.subtotales.map(String), ["200", "75"]);
});

test("redondea cada subtotal y monto monetario a dos decimales", () => {
  const result = calcularCotizacion(
    [{ cantidad: "0.333", precioUnitario: "10.01" }],
    "7.5",
    "12.5",
  );

  assert.equal(result.subtotalMateriales.toFixed(2), "3.33");
  assert.equal(result.montoGastos.toFixed(2), "0.25");
  assert.equal(result.montoManoObra.toFixed(2), "0.45");
  assert.equal(result.total.toFixed(2), "4.03");
});

test("rechaza cantidades, precios y porcentajes inválidos", () => {
  assert.throws(() => calcularCotizacion([{ cantidad: 0, precioUnitario: 1 }], 0, 0));
  assert.throws(() => calcularCotizacion([{ cantidad: 1, precioUnitario: -1 }], 0, 0));
  assert.throws(() => calcularCotizacion([{ cantidad: 1, precioUnitario: 1 }], -1, 0));
});
