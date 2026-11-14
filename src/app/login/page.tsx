import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";
export const dynamic="force-dynamic";
export default async function LoginPage(){if(await getSession())redirect("/calendario");return <main className="login-shell"><section className="login-main"><header className="login-header"><h1>¡Hola Diego!</h1><p>Ingresá tu PIN para iniciar sesión</p></header><LoginForm/></section></main>}
