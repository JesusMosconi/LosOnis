import Link from "next/link";
type Pedido={id:string;nombre:string;fechaConfirmacion:string;estado:"EN_PROCESO"|"ENTREGADO"};
export function PedidosSidebar({pedidos}:{pedidos:Pedido[]}){return <aside className="calendar-orders"><h2>Pedidos</h2><div>{pedidos.map(p=><Link href={`/pedidos/${p.id}`} className={p.estado.toLowerCase()} key={p.id}><strong>{p.nombre}</strong><span>{new Date(p.fechaConfirmacion).toLocaleDateString("es-AR",{timeZone:"UTC"})}</span></Link>)}</div></aside>}
