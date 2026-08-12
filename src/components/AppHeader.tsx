import Link from "next/link";
export function AppHeader(){return <header className="app-header"><div className="header-brand"><span className="material-symbols-outlined">menu</span><Link href="/pedidos">Los Onis</Link></div><Link className="today" href="/calendario">Hoy</Link></header>}
export function BackHeader({title,href="/pedidos"}:{title:string;href?:string}){return <header className="back-header"><Link aria-label="Volver" href={href}><span className="material-symbols-outlined">arrow_back</span></Link><h1>{title}</h1><span className="header-spacer"/></header>}
