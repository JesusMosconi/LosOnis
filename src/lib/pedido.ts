export type PedidoInput={nombre:string;telefono:string;tipoTrabajo:string;descripcion:string|null;fechaConfirmacion:Date;montoTotal:string};
export function parsePedido(body:unknown,partial=false){if(!body||typeof body!=="object")return null;const b=body as Record<string,unknown>;const data:Partial<PedidoInput>&{estado?:"EN_PROCESO"|"ENTREGADO"}={};
  if(typeof b.nombre==="string")data.nombre=b.nombre.trim();if(typeof b.telefono==="string")data.telefono=b.telefono.trim();if(typeof b.tipoTrabajo==="string")data.tipoTrabajo=b.tipoTrabajo.trim();if(typeof b.descripcion==="string"||b.descripcion===null)data.descripcion=b.descripcion?b.descripcion.trim():null;
  if(typeof b.fechaConfirmacion==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(b.fechaConfirmacion))data.fechaConfirmacion=new Date(`${b.fechaConfirmacion}T12:00:00.000Z`);
  if(typeof b.montoTotal==="string"||typeof b.montoTotal==="number"){const n=Number(b.montoTotal);if(Number.isFinite(n)&&n>=0)data.montoTotal=n.toFixed(2);}
  if(b.estado==="EN_PROCESO"||b.estado==="ENTREGADO")data.estado=b.estado;
  if(!partial&&(!data.nombre||!data.telefono||!data.tipoTrabajo||data.montoTotal===undefined))return null;
  if(["nombre","telefono","tipoTrabajo"].some(k=>k in b&&!data[k as keyof typeof data]))return null;return data;
}
