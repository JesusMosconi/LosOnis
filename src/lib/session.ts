import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const COOKIE="los-onis-session";
const key=()=>new TextEncoder().encode(process.env.SESSION_SECRET!);
export async function createSession(user:{id:string;nombre:string;role:string}){const token=await new SignJWT(user).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(key());(await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*30});}
export async function getSession(){const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;try{return (await jwtVerify(token,key())).payload as {id:string;nombre:string;role:string};}catch{return null;}}
