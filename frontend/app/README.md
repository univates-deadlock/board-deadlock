# Páginas do App Router

`layout.tsx` define a estrutura comum e as fontes. `page.tsx` é a página inicial;
`globals.css` contém estilos globais. A tela atual ainda é a inicial do Next.js.

A página institucional conforme Figma e as telas de autenticação/usuários devem
ser criadas pelos responsáveis pelo frontend. Preserve Server Components onde
não é necessário comportamento no navegador; formulários interativos precisam
de Client Components.

Os formulários de usuários devem seguir o contrato em
[docs/api-usuarios.md](../../docs/api-usuarios.md). Não apresente campos de
cadastro que a API não aceita. Trate `401`, `403`, `400` e `409` na interface.
