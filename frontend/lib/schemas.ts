/**
 * Schemas de validação do frontend, espelhando os da API.
 *
 * A validação aqui existe para dar retorno imediato ao usuário sem uma ida à
 * rede. O servidor continua sendo a autoridade: a API revalida tudo com os
 * mesmos schemas em `api/src/schemas/`.
 *
 * Por que Zod em vez de um regex solto: a API usa `z.email()`, que aplica as
 * regras de e-mail de verdade (posição de pontos, TLD alfabético, limites de
 * tamanho). Um regex permissivo aprovaria endereços que a API recusa, e o
 * usuário só descobriria o erro depois de esperar a requisição.
 */
import { z } from "zod";

/**
 * Campo de e-mail.
 *
 * Mesma cadeia usada em `api/src/schemas/user.schema.ts`:
 * `trim().toLowerCase()` normaliza antes de validar, `max(254)` é o limite da
 * RFC e `z.email()` confere o formato. A mensagem é em português porque é a que
 * aparece na tela; a API devolve a mensagem dela para os casos que escaparem.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-mail muito longo.")
  .pipe(z.email("Informe um e-mail válido."));

/** Formulário de login. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha."),
});

/** Tipo derivado do schema, para o formulário não divergir da validação. */
export type LoginInput = z.infer<typeof loginSchema>;
