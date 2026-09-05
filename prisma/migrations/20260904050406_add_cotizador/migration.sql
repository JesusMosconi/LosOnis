-- CreateEnum
CREATE TYPE "TipoProductoCatalogo" AS ENUM ('SIMPLE', 'VARIABLE');

-- CreateEnum
CREATE TYPE "EstadoSincronizacionCatalogo" AS ENUM ('EN_PROCESO', 'COMPLETADA', 'PARCIAL', 'FALLIDA');

-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('BORRADOR', 'FINALIZADA', 'ANULADA');

-- CreateTable
CREATE TABLE "ProductoCatalogo" (
    "id" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL DEFAULT 'ACERCO',
    "productoExternoId" INTEGER NOT NULL,
    "tipo" "TipoProductoCatalogo" NOT NULL,
    "nombre" TEXT NOT NULL,
    "sku" TEXT,
    "urlOrigen" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimaSincronizacion" TIMESTAMP(3),
    "ultimoError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaCatalogo" (
    "id" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL DEFAULT 'ACERCO',
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "urlOrigen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCatalogo" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "identificadorExterno" TEXT NOT NULL,
    "varianteExternaId" INTEGER,
    "nombre" TEXT NOT NULL,
    "sku" TEXT,
    "atributos" JSONB NOT NULL,
    "precio" DECIMAL(14,2) NOT NULL,
    "enStock" BOOLEAN,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "precioActualizadoEn" TIMESTAMP(3) NOT NULL,
    "ultimaSincronizacion" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SincronizacionCatalogo" (
    "id" TEXT NOT NULL,
    "estado" "EstadoSincronizacionCatalogo" NOT NULL DEFAULT 'EN_PROCESO',
    "urlOrigen" TEXT NOT NULL,
    "paginasProcesadas" INTEGER NOT NULL DEFAULT 0,
    "productosProcesados" INTEGER NOT NULL DEFAULT 0,
    "itemsProcesados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "detalleError" TEXT,
    "iniciadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEn" TIMESTAMP(3),

    CONSTRAINT "SincronizacionCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'BORRADOR',
    "clienteNombre" TEXT NOT NULL,
    "clienteTelefono" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "subtotalMateriales" DECIMAL(14,2) NOT NULL,
    "porcentajeGastos" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "montoGastos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "porcentajeManoObra" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "montoManoObra" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "notas" TEXT,
    "validaHasta" DATE,
    "creadaPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCotizacion" (
    "id" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "itemCatalogoId" TEXT,
    "nombre" TEXT NOT NULL,
    "sku" TEXT,
    "descripcion" TEXT,
    "unidad" TEXT,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "precioUnitario" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "urlOrigen" TEXT,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoriaCatalogoToProductoCatalogo" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoriaCatalogoToProductoCatalogo_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ProductoCatalogo_nombre_idx" ON "ProductoCatalogo"("nombre");

-- CreateIndex
CREATE INDEX "ProductoCatalogo_activo_idx" ON "ProductoCatalogo"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoCatalogo_proveedor_productoExternoId_key" ON "ProductoCatalogo"("proveedor", "productoExternoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoCatalogo_proveedor_urlOrigen_key" ON "ProductoCatalogo"("proveedor", "urlOrigen");

-- CreateIndex
CREATE INDEX "CategoriaCatalogo_nombre_idx" ON "CategoriaCatalogo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaCatalogo_proveedor_slug_key" ON "CategoriaCatalogo"("proveedor", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCatalogo_identificadorExterno_key" ON "ItemCatalogo"("identificadorExterno");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCatalogo_varianteExternaId_key" ON "ItemCatalogo"("varianteExternaId");

-- CreateIndex
CREATE INDEX "ItemCatalogo_productoId_idx" ON "ItemCatalogo"("productoId");

-- CreateIndex
CREATE INDEX "ItemCatalogo_nombre_idx" ON "ItemCatalogo"("nombre");

-- CreateIndex
CREATE INDEX "ItemCatalogo_sku_idx" ON "ItemCatalogo"("sku");

-- CreateIndex
CREATE INDEX "ItemCatalogo_activo_idx" ON "ItemCatalogo"("activo");

-- CreateIndex
CREATE INDEX "SincronizacionCatalogo_estado_iniciadaEn_idx" ON "SincronizacionCatalogo"("estado", "iniciadaEn");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_numero_key" ON "Cotizacion"("numero");

-- CreateIndex
CREATE INDEX "Cotizacion_estado_createdAt_idx" ON "Cotizacion"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "Cotizacion_clienteNombre_idx" ON "Cotizacion"("clienteNombre");

-- CreateIndex
CREATE INDEX "Cotizacion_creadaPorId_idx" ON "Cotizacion"("creadaPorId");

-- CreateIndex
CREATE INDEX "ItemCotizacion_cotizacionId_orden_idx" ON "ItemCotizacion"("cotizacionId", "orden");

-- CreateIndex
CREATE INDEX "ItemCotizacion_itemCatalogoId_idx" ON "ItemCotizacion"("itemCatalogoId");

-- CreateIndex
CREATE INDEX "_CategoriaCatalogoToProductoCatalogo_B_index" ON "_CategoriaCatalogoToProductoCatalogo"("B");

-- AddForeignKey
ALTER TABLE "ItemCatalogo" ADD CONSTRAINT "ItemCatalogo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "ProductoCatalogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCotizacion" ADD CONSTRAINT "ItemCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCotizacion" ADD CONSTRAINT "ItemCotizacion_itemCatalogoId_fkey" FOREIGN KEY ("itemCatalogoId") REFERENCES "ItemCatalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaCatalogoToProductoCatalogo" ADD CONSTRAINT "_CategoriaCatalogoToProductoCatalogo_A_fkey" FOREIGN KEY ("A") REFERENCES "CategoriaCatalogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaCatalogoToProductoCatalogo" ADD CONSTRAINT "_CategoriaCatalogoToProductoCatalogo_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductoCatalogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
