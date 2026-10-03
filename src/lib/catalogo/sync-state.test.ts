import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { startCatalogSync } from "./sync-state";

function replaceTransaction(t: TestContext, implementation: unknown) {
  const original = Reflect.get(prisma, "$transaction");
  Reflect.set(prisma, "$transaction", implementation);
  t.after(() => { Reflect.set(prisma, "$transaction", original); });
}

function transactionStartTimeout() {
  return new Prisma.PrismaClientKnownRequestError(
    "Transaction API error: Unable to start a transaction in the given time.",
    { code: "P2028", clientVersion: Prisma.prismaVersion.client },
  );
}

test("espera hasta 15 segundos para iniciar la transacción", async (t) => {
  let transactionOptions: unknown;
  const tx = {
    $queryRaw: async () => [{ acquired: true }],
    sincronizacionCatalogo: {
      findFirst: async () => null,
      create: async () => ({ id: "test-sync" }),
    },
  };
  replaceTransaction(t, async (callback: (db: typeof tx) => unknown, options: unknown) => {
    transactionOptions = options;
    return callback(tx);
  });

  const result = await startCatalogSync("https://example.com");

  assert.deepEqual(result, { id: "test-sync" });
  assert.deepEqual(transactionOptions, { maxWait: 15_000, timeout: 10_000 });
});

test("reintenta los timeouts transitorios y conserva las esperas configuradas", async (t) => {
  let attempts = 0;
  const waits: number[] = [];
  const tx = {
    $queryRaw: async () => [{ acquired: true }],
    sincronizacionCatalogo: {
      findFirst: async () => null,
      create: async () => ({ id: "recovered-sync" }),
    },
  };
  replaceTransaction(t, async (callback: (db: typeof tx) => unknown) => {
    attempts++;
    if (attempts < 3) throw transactionStartTimeout();
    return callback(tx);
  });

  const result = await startCatalogSync("https://example.com", {
    retryDelaysMs: [1_000, 3_000],
    sleep: async (milliseconds) => { waits.push(milliseconds); },
  });

  assert.deepEqual(result, { id: "recovered-sync" });
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [1_000, 3_000]);
});

test("propaga el timeout después de agotar los reintentos", async (t) => {
  let attempts = 0;
  replaceTransaction(t, async () => {
    attempts++;
    throw transactionStartTimeout();
  });

  await assert.rejects(
    startCatalogSync("https://example.com", { retryDelaysMs: [0, 0], sleep: async () => {} }),
    /Unable to start a transaction/,
  );
  assert.equal(attempts, 3);
});

test("no reintenta errores funcionales", async (t) => {
  let attempts = 0;
  replaceTransaction(t, async () => {
    attempts++;
    throw new Error("Ya hay una sincronización EN_PROCESO: running-sync");
  });

  await assert.rejects(
    startCatalogSync("https://example.com", { sleep: async () => {} }),
    /running-sync/,
  );
  assert.equal(attempts, 1);
});

test("no reintenta otros errores de Prisma", async (t) => {
  let attempts = 0;
  replaceTransaction(t, async () => {
    attempts++;
    throw new Prisma.PrismaClientKnownRequestError("Registro no encontrado", {
      code: "P2025",
      clientVersion: Prisma.prismaVersion.client,
    });
  });

  await assert.rejects(
    startCatalogSync("https://example.com", { sleep: async () => {} }),
    (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025",
  );
  assert.equal(attempts, 1);
});
