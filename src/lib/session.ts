import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isAllowedSession } from "@/lib/session-policy";
const COOKIE="los-onis-session";
const key=()=>new TextEncoder().encode(process.env.SESSION_SECRET!);
export async function createSession(user:{id:string;nombre:string}){const token=await new SignJWT(user).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(key());(await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*30});}
export async function getSession(){const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;try{const payload=(await jwtVerify(token,key())).payload;if(typeof payload.id!=="string")return null;const user=await prisma.usuario.findUnique({where:{id:payload.id},select:{id:true,nombre:true}});return isAllowedSession({id:payload.id,nombre:payload.nombre},user)?user:null;}catch{return null;}}
export function canAccessCotizador(session:{nombre?:unknown}|null){return typeof session?.nombre==="string"&&session.nombre.trim().toLocaleLowerCase("es")==="diego";}
