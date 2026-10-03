import { redirect } from "next/navigation";
import { BackHeader } from "@/components/AppHeader";
import { CotizadorForm } from "@/components/cotizador/CotizadorForm";
import { canAccessCotizador, getSession } from "@/lib/session";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAccessCotizador(session)) redirect("/calendario");

  return (
    <>
      <BackHeader title="Nueva cotización" href="/cotizador" />
      <CotizadorForm />
    </>
  );
}
