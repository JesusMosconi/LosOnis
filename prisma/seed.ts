import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";
const users = [{nombre:"Diego",pin:"1646"},{nombre:"Pablo",pin:"1234"}];
async function main(){for(const user of users){const existing=await prisma.usuario.findFirst({where:{nombre:user.nombre}});const pin=await hash(user.pin,12);if(existing)await prisma.usuario.update({where:{id:existing.id},data:{pin}});else await prisma.usuario.create({data:{nombre:user.nombre,pin}});}console.log(`Seed completado: ${await prisma.usuario.count()} usuarios en Neon.`);}
main().catch(error=>{console.error("No se pudo ejecutar el seed:",error);process.exitCode=1;}).finally(()=>prisma.$disconnect());
