export const datePattern=/^\d{4}-\d{2}-\d{2}$/;
export function dbDate(value:string){return new Date(`${value}T12:00:00.000Z`)}
export function validTurno(value:unknown):value is "MANANA"|"TARDE"{return value==="MANANA"||value==="TARDE"}
export function validEstado(value:unknown):value is "PENDIENTE"|"EN_PROCESO"|"REALIZADO"|"NO_CUMPLIDO"{return ["PENDIENTE","EN_PROCESO","REALIZADO","NO_CUMPLIDO"].includes(value as string)}
