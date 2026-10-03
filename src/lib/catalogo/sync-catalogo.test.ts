import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { prisma } from "@/lib/prisma";
import { syncAcercoCatalog } from "./sync-catalogo";

// Prisma exposes methods through a proxy, without method descriptors usable by
// mock.method. Restore every replacement at the end of each test.
function replaceMethod(t: TestContext, target: object, key: string, implementation: unknown) {
  const original = Reflect.get(target, key);
  Reflect.set(target, key, implementation);
  t.after(() => { Reflect.set(target, key, original); });
}

test("registra avances antes de terminar y continúa tras un producto fallido sin aplicar bajas", async (t) => {
  const checkpoints: { productosProcesados: number; errores: number; estado?: string }[] = [];
  let deactivated = false;
  const tx = {
    $queryRaw: async () => [{ acquired: true }],
    sincronizacionCatalogo: {
      findFirst: async () => null,
      create: async () => ({ id: "test-sync" }),
    },
    categoriaCatalogo: { upsert: async () => ({ id: "category" }) },
    productoCatalogo: { upsert: async () => ({ id: "product" }) },
    itemCatalogo: {
      findMany: async () => [],
      upsert: async () => ({}),
      updateMany: async () => ({ count: 0 }),
    },
  };
  replaceMethod(t, prisma, "$transaction", async (callback: (db: typeof tx) => unknown) => callback(tx));
  replaceMethod(t, prisma.sincronizacionCatalogo, "update", async ({ data }: { data: typeof checkpoints[number] }) => {
    checkpoints.push({ ...data });
    return {};
  });
  replaceMethod(t, prisma.productoCatalogo, "updateMany", async () => { deactivated = true; });
  const fetched: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    fetched.push(url);
    if (url.endsWith("/productos/")) {
      return new Response(`<ul class="products">${[1, 2, 3].map((id) =>
        `<li class="product"><h2><a href="/producto/${id}/">Producto ${id}</a></h2><button data-product_id="${id}"></button></li>`,
      ).join("")}</ul>`);
    }
    if (url.endsWith("/2/")) return new Response("Error", { status: 503 });
    if (url.endsWith("/3/")) {
      assert.ok(checkpoints.some((c) => c.productosProcesados === 1 && c.errores === 1 && !c.estado));
    }
    return new Response('<h1 class="product_title">Producto</h1><div class="summary"><p class="price"><span class="woocommerce-Price-amount">$100,00</span></p></div>');
  });
  const result = await syncAcercoCatalog();
  assert.equal(result.status, "PARCIAL");
  assert.equal(result.productsProcessed, 2);
  assert.equal(result.itemsProcessed, 2);
  assert.equal(result.errors.length, 1);
  assert.equal(fetched.filter((url) => url.endsWith("/2/")).length, 2);
  assert.equal(deactivated, false);
  assert.equal(checkpoints.at(-1)?.estado, "PARCIAL");
});

test("una ejecución activa impide iniciar otra antes de descargar o crear una fila", async (t) => {
  let created = false;
  const tx = {
    $queryRaw: async () => [{ acquired: true }],
    sincronizacionCatalogo: {
      findFirst: async () => ({ id: "running-sync" }),
      create: async () => { created = true; },
    },
  };
  replaceMethod(t, prisma, "$transaction", async (callback: (db: typeof tx) => unknown) => callback(tx));
  const fetchMock = t.mock.method(globalThis, "fetch", async () => { throw new Error("No debe descargar"); });
  await assert.rejects(syncAcercoCatalog(), /running-sync/);
  assert.equal(created, false);
  assert.equal(fetchMock.mock.callCount(), 0);
});
