import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";
const users = [{nombre:"Diego",pin:process.env.DIEGO_PIN}];
async function main(){for(const user of users){const existing=await prisma.usuario.findFirst({where:{nombre:user.nombre}});if(existing)continue;if(!user.pin||!/^\d{4}$/.test(user.pin))throw new Error("DIEGO_PIN debe contener 4 dígitos para crear la cuenta");const pin=await hash(user.pin,12);await prisma.usuario.create({data:{nombre:user.nombre,pin}});}console.log(`Seed completado: ${await prisma.usuario.count()} usuarios en Neon.`);}
main().catch(error=>{console.error("No se pudo ejecutar el seed:",error);process.exitCode=1;}).finally(()=>prisma.$disconnect());
