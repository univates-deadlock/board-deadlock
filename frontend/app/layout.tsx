import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * Fonte institucional da TechPro (a mesma do site público).
 * `next/font` faz o download em build time e expõe a CSS variable,
 * evitando requisição externa em runtime e layout shift.
 */
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TechPro — Sistema Interno",
    template: "%s | TechPro",
  },
  description: "Sistema interno de gestão de clientes, orçamentos e serviços da TechPro.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    /* lang pt-BR: o sistema é interno e a interface é em português */
    <html lang="pt-BR" className={`${rubik.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
