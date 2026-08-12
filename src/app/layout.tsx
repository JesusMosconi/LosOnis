import type { Metadata } from "next";
import "./globals.css";
/* eslint-disable @next/next/no-page-custom-font -- App Router root layout owns the document head. */
export const metadata:Metadata={title:"Los Onis",description:"Gestión del taller Los Onis"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/></head><body>{children}</body></html>}
