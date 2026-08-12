import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";
const users = [{nombre:"Juan",pin:"1234"},{nombre:"Pedro",pin:"2345"},{nombre:"María",pin:"3456"}];
async function main(){for(const user of users){const existing=await prisma.usuario.findFirst({where:{nombre:user.nombre}});const pin=await hash(user.pin,12);if(existing)await prisma.usuario.update({where:{id:existing.id},data:{pin}});else await prisma.usuario.create({data:{nombre:user.nombre,pin}});}}
main().finally(()=>prisma.$disconnect());
