"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { userEditSchema, userSchema } from "@/lib/schemas";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type UserFormData = {
  name: string;
  email: string;
  role: string;
  password: string;
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "PLANNING", label: "Orçamento / Planejamento" },
  { value: "TECHNICIAN", label: "Técnico" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  PLANNING: "Orçamento / Planejamento",
  TECHNICIAN: "Técnico",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";
const EMPTY_FORM: UserFormData = { name: "", email: "", role: "", password: "" };

/** Reads the API error body, falling back to a status-based message. */
async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error as string;
    /* Zod validation errors arrive as { error, fields: [{ path, message }] }. */
    if (Array.isArray(body?.fields) && body.fields.length > 0) {
      return body.fields
        .map((f: { path: string; message: string }) => f.message)
        .join(" ");
    }
  } catch {
    /* Body was not JSON; fall through to the status-based message. */
  }
  if (res.status === 401) return "Sessão expirada. Entre novamente.";
  if (res.status === 403) return "Acesso negado: apenas administradores podem gerenciar usuários.";
  return fallback;
}

/**
 * Validates the form with Zod and maps issues to field-level errors.
 *
 * The schema mirrors the API contract (api/src/schemas/user.schema.ts), so
 * anything caught here would also be rejected by the server.
 */
function validate(form: UserFormData): Record<string, string> {
  const result = userSchema.safeParse(form);

  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    /* Keep the first message per field: the UI shows one line per input. */
    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

/** Validates the edit form (no password field). */
function validateEdit(form: UserFormData): Record<string, string> {
  const result = userEditSchema.safeParse({
    name: form.name,
    email: form.email,
    role: form.role,
  });

  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export function UsuariosPageClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  /* Load the list on mount and after every mutation. */
  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/users`, {
          credentials: "include",
        });
        if (!active) return;
        if (!res.ok) {
          setError(await readError(res, "Não foi possível carregar a lista de usuários."));
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        if (active) {
          setUsers(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      } catch {
        if (active) {
          setError("Não foi possível falar com o servidor.");
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  function openCreateForm() {
    setEditingUserId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setFieldErrors({});
    setShowForm(true);
    setSuccessMessage("");
  }

  function openEditForm(user: User) {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });
    setFormError("");
    setFieldErrors({});
    setShowForm(true);
    setSuccessMessage("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingUserId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError("");

    const isEdit = editingUserId !== null;
    const errors = isEdit ? validateEdit(formData) : validate(formData);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Verifique os campos destacados.");
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const payload = isEdit
        ? { userData: { name: formData.name.trim(), email: formData.email.toLowerCase(), role: formData.role } }
        : { userData: formData };

      const res = await fetch(
        isEdit ? `${API_BASE}/api/users/${editingUserId}` : `${API_BASE}/api/users`,
        {
          method: isEdit ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        setFormError(await readError(res, isEdit ? "Não foi possível atualizar o usuário." : "Não foi possível criar o usuário."));
        setIsSubmitting(false);
        return;
      }

      closeForm();
      setSuccessMessage(isEdit ? "Usuário atualizado." : "Usuário cadastrado.");
      reload();
    } catch {
      setFormError("Não foi possível falar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(user: User) {
    setActionUserId(user.id);
    setError("");
    setSuccessMessage("");

    const action = user.isActive ? "deactivate" : "activate";

    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        setError(await readError(res, "Não foi possível alterar o status do usuário."));
        return;
      }

      setSuccessMessage(user.isActive ? "Usuário desativado." : "Usuário reativado.");
      reload();
    } catch {
      setError("Não foi possível falar com o servidor.");
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.15em] text-tp-primary">
            Administração
          </p>
          <h1 className="text-2xl font-bold text-tp-text-main">Usuários</h1>
        </div>
        <Button
          variant="primary"
          onClick={() => (showForm ? closeForm() : openCreateForm())}
        >
          {showForm ? "Cancelar" : "Novo usuário"}
        </Button>
      </div>

      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4">
          <Alert tone="success">{successMessage}</Alert>
        </div>
      ) : null}

      <Modal
        open={showForm}
        title={editingUserId ? "Editar usuário" : "Cadastrar usuário"}
        onClose={closeForm}
      >
        <form
          onSubmit={handleSubmit}
          noValidate
        >

          {formError ? (
            <div className="mb-4">
              <Alert tone="error">{formError}</Alert>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="user-name"
              label="Nome"
              required
              maxLength={200}
              value={formData.name}
              disabled={isSubmitting}
              error={fieldErrors.name}
              onChange={(e) => {
                setFormData((d) => ({ ...d, name: e.target.value }));
                if (fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
            />
            <Field
              id="user-email"
              label="E-mail"
              type="email"
              inputMode="email"
              required
              maxLength={254}
              value={formData.email}
              disabled={isSubmitting}
              error={fieldErrors.email}
              onChange={(e) => {
                setFormData((d) => ({ ...d, email: e.target.value.toLowerCase() }));
                if (fieldErrors.email) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
            />
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="user-role"
                className="text-sm font-semibold text-tp-text-main"
              >
                Perfil
              </label>
              <select
                id="user-role"
                required
                value={formData.role}
                disabled={isSubmitting}
                onChange={(e) => {
                  setFormData((d) => ({ ...d, role: e.target.value }));
                  if (fieldErrors.role) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.role;
                      return next;
                    });
                  }
                }}
                className={`w-full rounded-tp-sm border bg-white px-3 py-2.5 text-base text-tp-text-main transition-colors focus:outline-none disabled:bg-tp-neutral-100 ${
                  fieldErrors.role
                    ? "border-tp-danger focus:border-tp-danger"
                    : "border-tp-border focus:border-tp-primary"
                }`}
              >
                <option value="">Selecione…</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.role ? (
                <p className="text-sm text-tp-danger">{fieldErrors.role}</p>
              ) : null}
            </div>
            {editingUserId === null ? (
              <Field
                id="user-password"
                label="Senha"
                type="password"
                required
                minLength={8}
                maxLength={128}
                hint="Mínimo de 8 caracteres."
                value={formData.password}
                disabled={isSubmitting}
                error={fieldErrors.password}
                onChange={(e) => {
                  setFormData((d) => ({ ...d, password: e.target.value }));
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.password;
                      return next;
                    });
                  }
                }}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-tp-text-main">Senha</p>
                <p className="text-sm text-tp-text-muted">
                  Não editável. Para trocar a senha, desative e recrie o usuário.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button type="submit" variant="primary" isLoading={isSubmitting} loadingLabel="Salvando…">
              {editingUserId ? "Salvar alterações" : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      {isLoading ? (
        <p className="text-tp-text-muted">Carregando usuários…</p>
      ) : users.length === 0 ? (
        <div className="rounded-tp-md border border-dashed border-tp-border bg-white px-5 py-8 text-center">
          <p className="text-sm text-tp-text-muted">
            Nenhum usuário cadastrado.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-tp-md border border-tp-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tp-border-light bg-tp-neutral-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-tp-text-main">Nome</th>
                <th className="px-4 py-3 font-semibold text-tp-text-main">E-mail</th>
                <th className="px-4 py-3 font-semibold text-tp-text-main">Perfil</th>
                <th className="px-4 py-3 font-semibold text-tp-text-main">Status</th>
                <th className="px-4 py-3 font-semibold text-tp-text-main text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border-light">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-tp-neutral-50">
                  <td className="px-4 py-3 text-tp-text-main">{user.name}</td>
                  <td className="px-4 py-3 text-tp-text-body">{user.email}</td>
                  <td className="px-4 py-3 text-tp-text-body">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? "bg-tp-green-500/10 text-tp-green-600"
                          : "bg-tp-danger/10 text-tp-danger"
                      }`}
                    >
                      {user.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => openEditForm(user)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actionUserId === user.id}
                        onClick={() => toggleActive(user)}
                      >
                        {user.isActive ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}