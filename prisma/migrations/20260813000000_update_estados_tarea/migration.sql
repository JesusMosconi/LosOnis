-- CreateEnum
CREATE TYPE "EstadoTarea_nuevo" AS ENUM ('PROGRAMADO', 'REALIZADO', 'NO_CUMPLIDO', 'REPROGRAMADO');

-- AlterTable
ALTER TABLE "Tarea" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Tarea" ALTER COLUMN "estado" TYPE "EstadoTarea_nuevo" USING (
  CASE
    WHEN "estado"::text IN ('PENDIENTE', 'EN_PROCESO') THEN 'PROGRAMADO'
    ELSE "estado"::text
  END
)::"EstadoTarea_nuevo";

-- DropEnum
DROP TYPE "EstadoTarea";
ALTER TYPE "EstadoTarea_nuevo" RENAME TO "EstadoTarea";
ALTER TABLE "Tarea" ALTER COLUMN "estado" SET DEFAULT 'PROGRAMADO';
