import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * TechPro brand font, shared with the public website.
 * `next/font` downloads it at build time and exposes a CSS variable,
 * avoiding external runtime requests and layout shifts.
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
    /* Match the document language to the Brazilian Portuguese interface. */
    <html lang="pt-BR" className={`${rubik.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
