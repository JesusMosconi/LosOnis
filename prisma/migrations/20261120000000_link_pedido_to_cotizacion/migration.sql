ALTER TABLE "Pedido" RENAME COLUMN "tipoTrabajo" TO "titulo";
ALTER TABLE "Pedido" ADD COLUMN "cotizacionId" TEXT;
CREATE UNIQUE INDEX "Pedido_cotizacionId_key" ON "Pedido"("cotizacionId");
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
