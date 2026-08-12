import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
export async function POST(request:Request){try{const {userId,pin}=await request.json();if(typeof userId!=="string"||!/^\d{4}$/.test(pin))return NextResponse.json({error:"Datos inválidos"},{status:400});const user=await prisma.usuario.findUnique({where:{id:userId}});if(!user||!(await compare(pin,user.pin)))return NextResponse.json({error:"Usuario o PIN incorrecto"},{status:401});await createSession({id:user.id,nombre:user.nombre});return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"No se pudo iniciar sesión"},{status:500});}}
