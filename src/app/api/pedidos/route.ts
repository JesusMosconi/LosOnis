import { NextResponse } from "next/server";import { prisma } from "@/lib/prisma";import { getSession } from "@/lib/session";
export async function GET(){if(!await getSession())return NextResponse.json({error:"No autorizado"},{status:401});return NextResponse.json(await prisma.pedido.findMany({orderBy:{fechaConfirmacion:"desc"}}));}
export async function POST(){if(!await getSession())return NextResponse.json({error:"No autorizado"},{status:401});return NextResponse.json({error:"Los pedidos se crean al confirmar una cotización"},{status:405});}
