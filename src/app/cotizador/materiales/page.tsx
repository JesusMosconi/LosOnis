import { redirect } from "next/navigation";
import { BackHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/prisma";
import { canAccessCotizador, getSession } from "@/lib/session";
import { MaterialesPropiosManager } from "./MaterialesPropiosManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAccessCotizador(session)) redirect("/calendario");
  const rows = await prisma.materialPropio.findMany({
    where: { activo: true },
    orderBy: [{ nombre: "asc" }, { id: "asc" }],
    select: { id: true, nombre: true, descripcion: true, precioUnitario: true },
  });
  const materials = rows.map((item) => ({ ...item, precioUnitario: item.precioUnitario.toFixed(2) }));
  return <><BackHeader title="Mis materiales" href="/cotizador" /><MaterialesPropiosManager initialMaterials={materials} /></>;
}
