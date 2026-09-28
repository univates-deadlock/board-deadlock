import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* O indicador de desenvolvimento (o "N" no canto) sai da tela por padrão.
     Erros de compilação e de runtime continuam aparecendo: a doc do Next 16
     garante que só o selo informativo é escondido. */
  devIndicators: false,
};

export default nextConfig;
