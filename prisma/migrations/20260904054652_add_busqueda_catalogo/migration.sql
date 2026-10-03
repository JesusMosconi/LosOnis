-- AlterTable
ALTER TABLE "ItemCatalogo" ADD COLUMN     "textoBusqueda" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "ItemCatalogo_textoBusqueda_idx" ON "ItemCatalogo"("textoBusqueda");
