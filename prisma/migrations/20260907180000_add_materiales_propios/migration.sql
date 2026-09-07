-- CreateTable
CREATE TABLE "MaterialPropio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioUnitario" DECIMAL(14,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialPropio_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ItemCotizacion" ADD COLUMN "materialPropioId" TEXT;

-- CreateIndex
CREATE INDEX "MaterialPropio_nombre_idx" ON "MaterialPropio"("nombre");

-- CreateIndex
CREATE INDEX "MaterialPropio_activo_idx" ON "MaterialPropio"("activo");

-- CreateIndex
CREATE INDEX "ItemCotizacion_materialPropioId_idx" ON "ItemCotizacion"("materialPropioId");

-- AddForeignKey
ALTER TABLE "ItemCotizacion" ADD CONSTRAINT "ItemCotizacion_materialPropioId_fkey" FOREIGN KEY ("materialPropioId") REFERENCES "MaterialPropio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
