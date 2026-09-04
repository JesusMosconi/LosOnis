import { redirect } from "next/navigation";
import { BackHeader } from "@/components/AppHeader";
import { CotizadorForm } from "@/components/cotizador/CotizadorForm";
import { getSession } from "@/lib/session";

export default async function Page() {
  if (!(await getSession())) redirect("/login");

  return (
    <>
      <BackHeader title="Nueva cotización" href="/cotizador" />
      <CotizadorForm />
    </>
  );
}
