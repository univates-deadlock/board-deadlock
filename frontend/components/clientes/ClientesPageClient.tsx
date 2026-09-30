"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { clientSchema } from "@/lib/schemas";
import {
  maskDocument,
  maskPhone,
  onlyDigits,
  type DocumentKind,
} from "@/lib/masks";

/**
 * Clientes CRUD.
 *
 * Contract: api/src/routes/client.route.ts
 *   GET    /api/clients            -> Client[]
 *   POST   /api/clients            -> 201 Client   (body: ClientInput, direct — not wrapped)
 *   GET    /api/clients/:id        -> Client
 *   PATCH  /api/clients/:id        -> Client       (body: Partial<ClientInput>, direct)
 *   PATCH  /api/clients/:id/activate
 *   PATCH  /api/clients/:id/deactivate
 *
 * All routes require an active session and role ADMIN or PLANNING;
 * a TECHNICIAN receives 403. Error shape is { error: string }.
 *
 * Document and phone fields are masked while typing (see lib/masks.ts) and
 * sent as digits only, matching the payloads in api/tests/client.http.
 */

type ClientType = DocumentKind;

type Client = {
  id: string;
  type: ClientType;
  name: string;
  document: string | null;
  notes: string | null;
  active: boolean;
  contactName: string | null;
  phone: string | null;
  whatsapp: string;
  location: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Form state holds the *displayed* (masked) text. */
type ClientFormData = {
  type: ClientType;
  name: string;
  document: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  notes: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

const TYPE_LABELS: Record<ClientType, string> = {
  INDIVIDUAL: "Pessoa Física",
  COMPANY: "Pessoa Jurídica",
};

const EMPTY_FORM: ClientFormData = {
  type: "INDIVIDUAL",
  name: "",
  document: "",
  contactName: "",
  phone: "",
  whatsapp: "",
  email: "",
  location: "",
  notes: "",
};

/**
 * Builds the API payload from the masked form values.
 *
 * Documents and phones are stripped to digits; optional text fields become
 * null when blank, matching the schema (`nullable().optional()`).
 */
function toPayload(form: ClientFormData) {
  const optional = (value: string) => (value.trim() ? value.trim() : null);
  const optionalDigits = (value: string) => {
    const d = onlyDigits(value);
    return d ? d : null;
  };

  return {
    type: form.type,
    name: form.name.trim(),
    document: optionalDigits(form.document),
    contactName: optional(form.contactName),
    phone: optionalDigits(form.phone),
    whatsapp: onlyDigits(form.whatsapp),
    location: form.location.trim(),
    email: optional(form.email),
    notes: optional(form.notes),
  };
}

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
  if (res.status === 403) {
    return "Acesso negado: seu perfil não pode gerenciar clientes.";
  }
  return fallback;
}

/**
 * Validates the form with Zod and maps issues to field-level errors.
 *
 * The schema mirrors the API contract (api/src/schemas/client.schema.ts), so
 * anything caught here would also be rejected by the server. Values are
 * stripped to digits / trimmed before validation, because that is exactly
 * what `toPayload` sends.
 */
function validate(form: ClientFormData): Record<string, string> {
  const result = clientSchema.safeParse({
    ...form,
    document: onlyDigits(form.document),
    phone: onlyDigits(form.phone),
    whatsapp: onlyDigits(form.whatsapp),
  });

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

export function ClientesPageClient() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  /* Load the list on mount and after every mutation. */
  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/clients`, {
          credentials: "include",
        });
        if (!active) return;

        if (!res.ok) {
          setError(await readError(res, "Não foi possível carregar os clientes."));
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        if (active) {
          setClients(Array.isArray(data) ? data : []);
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
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setFieldErrors({});
    setShowForm(true);
  }

  function openEditForm(client: Client) {
    setEditingId(client.id);
    /* Stored digits are re-masked so the form shows the formatted value. */
    setFormData({
      type: client.type,
      name: client.name,
      document: client.document ? maskDocument(client.document, client.type) : "",
      contactName: client.contactName ?? "",
      phone: client.phone ? maskPhone(client.phone) : "",
      whatsapp: maskPhone(client.whatsapp),
      email: client.email ?? "",
      location: client.location,
      notes: client.notes ?? "",
    });
    setFormError("");
    setFieldErrors({});
    setShowForm(true);
    setSuccessMessage("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setFieldErrors({});
  }

  /** Updates one field and clears its error as soon as the user edits it. */
  function updateField<K extends keyof ClientFormData>(
    key: K,
    value: ClientFormData[K],
  ) {
    setFormData((d) => ({ ...d, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((e) => {
        const next = { ...e };
        delete next[key as string];
        return next;
      });
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError("");

    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Verifique os campos destacados.");
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    const isEdit = editingId !== null;

    try {
      const res = await fetch(
        isEdit ? `${API_BASE}/api/clients/${editingId}` : `${API_BASE}/api/clients`,
        {
          method: isEdit ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(formData)),
        },
      );

      if (!res.ok) {
        setFormError(await readError(res, "Não foi possível salvar o cliente."));
        setIsSubmitting(false);
        return;
      }

      closeForm();
      setSuccessMessage(isEdit ? "Cliente atualizado." : "Cliente cadastrado.");
      reload();
    } catch {
      setFormError("Não foi possível falar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(client: Client) {
    setActionId(client.id);
    setError("");
    setSuccessMessage("");

    const action = client.active ? "deactivate" : "activate";

    try {
      const res = await fetch(`${API_BASE}/api/clients/${client.id}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        setError(await readError(res, "Não foi possível alterar o status."));
        return;
      }

      setSuccessMessage(client.active ? "Cliente inativado." : "Cliente reativado.");
      reload();
    } catch {
      setError("Não foi possível falar com o servidor.");
    } finally {
      setActionId(null);
    }
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.document ?? "").includes(onlyDigits(search)),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.15em] text-tp-primary">
            Cadastro
          </p>
          <h1 className="text-2xl font-bold text-tp-text-main">Clientes</h1>
        </div>
        <Button
          variant="primary"
          onClick={() => (showForm ? closeForm() : openCreateForm())}
        >
          {showForm ? "Cancelar" : "Novo cliente"}
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
        title={editingId ? "Editar cliente" : "Cadastrar cliente"}
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
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="client-type"
                className="text-sm font-semibold text-tp-text-main"
              >
                Tipo
              </label>
              <select
                id="client-type"
                value={formData.type}
                disabled={isSubmitting}
                onChange={(e) => {
                  const type = e.target.value as ClientType;
                  /* Re-mask the document: the CPF/CNPJ format changes with the type. */
                  setFormData((d) => ({
                    ...d,
                    type,
                    document: maskDocument(d.document, type),
                  }));
                  setFieldErrors((errs) => {
                    const next = { ...errs };
                    delete next.document;
                    return next;
                  });
                }}
                className="w-full rounded-tp-sm border border-tp-border bg-white px-3 py-2.5 text-base text-tp-text-main focus:outline-none focus:border-tp-primary disabled:bg-tp-neutral-100"
              >
                <option value="INDIVIDUAL">Pessoa Física</option>
                <option value="COMPANY">Pessoa Jurídica</option>
              </select>
            </div>

            <Field
              id="client-name"
              label="Nome / Razão social"
              required
              maxLength={200}
              value={formData.name}
              disabled={isSubmitting}
              error={fieldErrors.name}
              onChange={(e) => updateField("name", e.target.value)}
            />

            <Field
              id="client-document"
              label={formData.type === "COMPANY" ? "CNPJ" : "CPF"}
              inputMode="numeric"
              maxLength={formData.type === "COMPANY" ? 18 : 14}
              hint={
                formData.type === "COMPANY"
                  ? "00.000.000/0000-00"
                  : "000.000.000-00"
              }
              value={formData.document}
              disabled={isSubmitting}
              error={fieldErrors.document}
              onChange={(e) =>
                updateField("document", maskDocument(e.target.value, formData.type))
              }
            />

            <Field
              id="client-contact"
              label="Contato"
              maxLength={200}
              value={formData.contactName}
              disabled={isSubmitting}
              error={fieldErrors.contactName}
              onChange={(e) => updateField("contactName", e.target.value)}
            />

            <Field
              id="client-phone"
              label="Telefone"
              type="tel"
              inputMode="tel"
              maxLength={15}
              hint="(00) 0000-0000"
              value={formData.phone}
              disabled={isSubmitting}
              error={fieldErrors.phone}
              onChange={(e) => updateField("phone", maskPhone(e.target.value))}
            />

            <Field
              id="client-whatsapp"
              label="WhatsApp"
              type="tel"
              inputMode="tel"
              maxLength={15}
              hint="(00) 00000-0000"
              value={formData.whatsapp}
              disabled={isSubmitting}
              error={fieldErrors.whatsapp}
              onChange={(e) => updateField("whatsapp", maskPhone(e.target.value))}
            />

            <Field
              id="client-email"
              label="E-mail"
              type="email"
              inputMode="email"
              maxLength={100}
              value={formData.email}
              disabled={isSubmitting}
              error={fieldErrors.email}
              onChange={(e) => updateField("email", e.target.value)}
            />

            <Field
              id="client-location"
              label="Local de atendimento"
              maxLength={100}
              value={formData.location}
              disabled={isSubmitting}
              error={fieldErrors.location}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="client-notes"
              className="mb-1.5 block text-sm font-semibold text-tp-text-main"
            >
              Observações
            </label>
            <textarea
              id="client-notes"
              rows={3}
              value={formData.notes}
              disabled={isSubmitting}
              onChange={(e) => updateField("notes", e.target.value)}
              className="w-full rounded-tp-sm border border-tp-border bg-white px-3 py-2.5 text-base text-tp-text-main focus:outline-none focus:border-tp-primary disabled:bg-tp-neutral-100"
            />
          </div>

          <div className="mt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              loadingLabel="Salvando…"
            >
              {editingId ? "Salvar alterações" : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="mb-4">
        <Field
          id="client-search"
          label="Buscar"
          type="search"
          placeholder="Nome ou documento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-tp-text-muted">Carregando clientes…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-tp-md border border-dashed border-tp-border bg-white px-5 py-8 text-center">
          <p className="text-sm text-tp-text-muted">
            {search
              ? "Nenhum cliente encontrado para a busca."
              : "Nenhum cliente cadastrado."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-tp-md border border-tp-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-tp-border-light bg-tp-neutral-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-tp-text-main">Nome</th>
                <th className="px-4 py-3 font-semibold text-tp-text-main">Tipo</th>
                <th className="px-4 py-3 font-semibold text-tp-text-main">
                  Documento
                </th>
                <th className="px-4 py-3 font-semibold text-tp-text-main">
                  WhatsApp
                </th>
                <th className="px-4 py-3 font-semibold text-tp-text-main">Local</th>
                <th className="px-4 py-3 font-semibold text-tp-text-main">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-tp-text-main">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border-light">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-tp-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-tp-text-main">{client.name}</p>
                    {client.contactName ? (
                      <p className="text-xs text-tp-text-muted">
                        Contato: {client.contactName}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-tp-text-body">
                    {TYPE_LABELS[client.type] ?? client.type}
                  </td>
                  <td className="px-4 py-3 text-tp-text-body">
                    {client.document
                      ? maskDocument(client.document, client.type)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-tp-text-body">
                    {maskPhone(client.whatsapp)}
                  </td>
                  <td className="px-4 py-3 text-tp-text-body">{client.location}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        client.active
                          ? "bg-tp-green-500/10 text-tp-green-600"
                          : "bg-tp-danger/10 text-tp-danger"
                      }`}
                    >
                      {client.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => openEditForm(client)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actionId === client.id}
                        onClick={() => toggleActive(client)}
                      >
                        {client.active ? "Desativar" : "Ativar"}
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
