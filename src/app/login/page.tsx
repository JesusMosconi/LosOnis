import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";
export const dynamic="force-dynamic";
export default async function LoginPage(){if(await getSession())redirect("/calendario");const users=await prisma.usuario.findMany({select:{id:true,nombre:true},orderBy:{createdAt:"asc"}});return <main className="login-shell"><section className="login-main"><header className="login-header"><h1>Bienvenido</h1><p>Selecciona tu usuario e ingresa tu PIN</p></header><LoginForm users={users}/></section></main>}
