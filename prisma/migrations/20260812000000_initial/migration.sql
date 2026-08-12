-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('EN_PROCESO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANANA', 'TARDE');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'REALIZADO', 'NO_CUMPLIDO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "tipoTrabajo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaConfirmacion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'EN_PROCESO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "turno" "Turno" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "reprogramadaAId" TEXT,
    "actualizadoPorId" TEXT,
    "actualizadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tarea_reprogramadaAId_key" ON "Tarea"("reprogramadaAId");

-- CreateIndex
CREATE INDEX "Tarea_pedidoId_idx" ON "Tarea"("pedidoId");

-- CreateIndex
CREATE INDEX "Tarea_fecha_turno_idx" ON "Tarea"("fecha", "turno");

-- CreateIndex
CREATE INDEX "Tarea_actualizadoPorId_idx" ON "Tarea"("actualizadoPorId");

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_reprogramadaAId_fkey" FOREIGN KEY ("reprogramadaAId") REFERENCES "Tarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
