-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERARIO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ADMIN';
