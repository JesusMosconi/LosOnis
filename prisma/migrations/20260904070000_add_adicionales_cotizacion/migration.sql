-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN "montoAdicionales" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AdicionalCotizacion" (
    "id" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdicionalCotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdicionalCotizacion_cotizacionId_orden_idx" ON "AdicionalCotizacion"("cotizacionId", "orden");

-- AddForeignKey
ALTER TABLE "AdicionalCotizacion" ADD CONSTRAINT "AdicionalCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
