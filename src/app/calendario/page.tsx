import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
export default async function CalendarioPage(){const session=await getSession();if(!session)redirect("/login");return <main className="placeholder"><div><h1>Los Onis</h1><p>Hola, {session.nombre}. El calendario se implementará en el próximo paso.</p></div></main>}
