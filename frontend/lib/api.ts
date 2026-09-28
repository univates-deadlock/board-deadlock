/**
 * Cliente HTTP centralizado para a API do sistema.
 *
 * Motivos de existir:
 * - evita repetir a URL base em cada componente (a skill pede um único
 *   ponto para baseURL, credenciais e normalização de erro);
 * - mantém `credentials: "include"` obrigatório, porque a sessão do
 *   Better Auth viaja em cookie HttpOnly e não seria enviada por padrão
 *   em requisições cross-origin (frontend :3000, API :4000);
 * - normaliza as duas formas de erro que a API usa: `{ error }` nos CRUDs
 *   e `{ message }` nas rotas nativas do Better Auth.
 *
 * Somente `NEXT_PUBLIC_*` é usado aqui: qualquer valor lido neste arquivo
 * pode chegar ao browser. Nenhum secret entra neste módulo.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Erro de domínio com o status HTTP preservado, para a UI distinguir 401, 403 e 5xx. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Extrai a mensagem legível das duas formas de erro conhecidas da API. */
function readErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string") return record.error; // CRUDs da aplicação
    if (typeof record.message === "string") return record.message; // erro nativo do Better Auth
  }
  return `Falha na requisição (HTTP ${status}).`;
}

/**
 * Executa uma requisição autenticada e devolve o JSON tipado.
 * Lança `ApiError` em qualquer resposta fora da faixa 2xx.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    /* Obrigatório para o cookie de sessão; o CORS da API aceita credenciais. */
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  /* 204 (No Content) não tem corpo para desserializar. */
  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    throw new ApiError(readErrorMessage(parsed, response.status), response.status);
  }

  return parsed as T;
}
