"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { quoteSchema } from "@/lib/schemas";

type QuoteStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED";
type QuoteItemType = "PRODUCT" | "SERVICE" | "OTHER";

type ClientOption = {
    id: string;
    name: string;
};


/* ==========================================================================
   REACT FORM STRUCTURES
   ========================================================================== */


// Quote item forms estructure
type QuoteItemFormData = {
    type: QuoteItemType;
    description: string;
    quantity: string;
    unitPrice: string;
    discount?: string;
};

// Global quote form structure
type QuoteFormData = {
    clientId: string;
    notes: string;
    discount: string;
    items: QuoteItemFormData[]; // Array of quote items
};

// structure for quote objects received from the API
type Quote = {
    id: string;
    clientId: string;
    status: QuoteStatus;
    subtotal: number;
    discount: number;
    total: number;
    notes?: string | null;
    createdAt: string;
    client?: {
        id: string;
        name: string;
        type: string;
    }
};


//  !!!!! CONFIRMAR !!!!! ==========================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const EMPTY_ITEM: QuoteItemFormData = {
  type: "SERVICE",
  description: "",
  quantity: "1",
  unitPrice: "0",
  discount: "0",
};

// Default pattern to an empty quote form
const EMPTY_FORM: QuoteFormData = {
    clientId: "",
    notes: "",
    discount: "0",
    items: [{ ...EMPTY_ITEM }],
};

/* ==========================================================================
   Convertion and validation functions
   ========================================================================== */

   //converts a numeric JS value to a R$
   function formatCurrency(value: number): string {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
   }

/*  =========== CONVERTS STRINGS INTO NUMBERS ===========
    HTML = 'strings' -- API = 'number' (float/integer)
    cleans and converts the object 'QuoteFormData' to the API format
*/
   function toPayload(form: QuoteFormData){
    const parseNum = (val: string) => {
        const clean = val.replace(/[^\d,]/g, "").replace(",", ".");
        const parsed = parseFloat(clean) || 0; 
        return Number(parsed.toFixed(2)); // max. 2 decial cases
    };

    return {
        clientId: form.clientId,
        notes: form.notes.trim() ? form.notes.trim() : undefined,
        discount: parseNum(form.discount),
        items: form.items.map((item) => ({
            type: item.type,
            description: item.description.trim(),
            quantity: parseNum(item.quantity),
            unitPrice: parseNum(item.unitPrice),
            discount: item.discount ? parseNum(item.discount) : 0, //converts discount to 0 if not provided
        })),
    };

   }

/* =========== ZOD SCHEMA VALIDATION ===========
   executes if the payload is valid
   if it has erros, maps the field and returns the error messages in an object
 */
   function validate(form: QuoteFormData): Record<string, string> {
    const payload = toPayload(form); //prepare the types of data
    const result = quoteSchema.safeParse(payload); // validate without throwing an exception
    
    if (result.success) return {}; // no errors = return an empty object

    const errors: Record<string, string> = {}; //creates an empty object to store the errors

    // Map the errors to a more usable format
    for (const issue of result.error.issues) {
        const pathKey = issue.path.join("."); // create a key based on the path of the error
        if (!errors[pathKey]) {
            errors[pathKey] = issue.message; // assign the error message to the corresponding key
        }
    }
    return errors;
   }

/* ==========================================================================
    PAGE COMPONENT
        executes automatically when the page is loaded, and after every mutation (create, update, delete)
   ========================================================================== */

    export function OrcamentosPageQuote() {
        const [quotes, setQuotes] = useState<Quote[]>([]); //list quotes
        const [clients, setClients] = useState<ClientOption[]>([]); //list of clients for the select input
        const [isLoading, setIsLoading] = useState(true); // state to indicate if the data is still loading (req GET)
        const [error, setError] = useState(""); // global error message if API request fails
        const [successMessage, setSuccessMessage] = useState(""); // success message after a creation/update

        //form state and moadal
        const [showForm, setShowForm] = useState(false); // controls if the modal form is open
        const [editingId, setEditingId] = useState<string | null>(null); // If it's null = new quote, if it has a ID (string) = editing an existing quote
        const [formData, setFormData] = useState<QuoteFormData>(EMPTY_FORM); // stores the current data for all fields in the form
        const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // stores specific error for each field
        const [isSubmitting, setIsSubmitting] = useState(false); // "true" = submission in progress >> disable submission button (prevent multiple submissions) (POST/PATCH)

        // search and filter state
        const [searchTerm, setSearchTerm] = useState(""); // term used in the search/filter field
        const [reloadKey, setReloadKey] = useState(0); // number counter to trigger useEffect() to search and reload the data after a mutation

        // LIFE CYCLE - Load the list on mount and after every mutation
        useEffect(() => {
            let active = true; // flag to check if the component is still mounted before updating state

            (async () => {
            setIsLoading(true); 
            setError(""); // cleans errors from previous requests

            try {
                // search quotes and clients in parallel
                const [resQuotes, resClients] = await Promise.all([
                fetch(`${API_BASE}/api/quotes`, { credentials: "include" }),
                fetch(`${API_BASE}/api/clients`, { credentials: "include" }),
                ]);

                if (!active) return; // if the component has unmounted, do not update states

                // if the quotes request was successful, parse the JSON and update the state
                if (resQuotes.ok) { // check if the response is OK (status 200-299)
                const quotesData = await resQuotes.json(); // transforms JSON string returned by API into a JS object
                setQuotes(Array.isArray(quotesData) ? quotesData : []); // saves in the state
                }

                if (resClients.ok) {
                const clientsData = await resClients.json();
                setClients(
                    Array.isArray(clientsData)
                    ? clientsData.map((c: { id: string; name: string }) => ({
                            id: c.id,
                            name: c.name,
                        }))
                    : []
                );
                }
            } catch {
                if (active) setError("Erro ao conectar com o servidor.");
            } finally {
                if (active) setIsLoading(false); // removes loading state
            }
            })();

            // cleanup function when the component unmounts
            return () => {
                active = false;
            };
        }, [reloadKey]); // re-run when the reloadKey changes (after a mutation)


        //trigger reload - autoincrement the key to force a new cicle in useEffect() and reload the lists
        function reload() {
            setReloadKey((k) => k + 1);
        }

        // opens the modal form to CREATE a new quote
        function openCreateForm() {
            setEditingId(null); // indicates that it's a new quote
            setFormData(EMPTY_FORM);
            setFieldErrors({});
            setShowForm(true);
        }

        // closes the modal and resets the form and errors
        function closeForm() {
            setShowForm(false);
            setEditingId(null);
            setFormData(EMPTY_FORM);
            setFieldErrors({});
        }

        //  ======= DINAMIC FORM FUNCTIONS - for the quote items array in the form =======
        // adds a new empty item to the quote form Array
        function addItem() {
            setFormData((prev) => ({ 
                ...prev, // keep the previous form data
                items: [...prev.items, { ...EMPTY_ITEM }], // copies the previous items and adds a new empty item at the end
            }));
        }

        // removes an item from the quote form Array by its index
        function removeItem(index: number) { 
            setFormData((prev) => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index), // .filter() = new array with all elements that pass the test >> (_, i) => i !== index = maintain in the array all items whose index is DIFFERENT from the one to be removed
            }));
        }

        // updates a specific field of a specific item in the quote form Array
            // var field needs to be a valid fiel of QuoteItemFormData (type, description...)
        function updateItem(index: number, field: keyof QuoteItemFormData, value: string) {
            setFormData((prev) => {
                const nextItems = [...prev.items]; // copy os the previous items array so we can modify safely
                nextItems[index] = { ...nextItems[index], [field]: value }; // brings the item at the index >> brings the field and value to be updated
                return { ...prev, items: nextItems }; 
            });
        }

 // ====== FORM SUBMISSION (creation/update) =======
        async function handleSubmit(event: React.FormEvent) {
            event.preventDefault(); // prevents HTML from reload
            if (isSubmitting) return;

            // 1) local validation (Zod)
            const errors = validate(formData);
            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors); // shows form errors if validation fails
                return;
            }

            setIsSubmitting(true);
            const isEdit = editingId !== null;

            try{
                const res = await fetch(
                    isEdit ? `${API_BASE}/api/quotes/${editingId}` : `${API_BASE}/api/quotes`,
                    {
                        method: isEdit ? "PATCH" : "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(toPayload(formData)), // sends convert data in JSON
                    }
                );

                if (!res.ok){
                    setError("Não foi possível salvar o orçamento.");
                    return;
                }

                // success = closes modal, cleans state and reload data
                closeForm();
                setSuccessMessage(isEdit ? "Orçamento atualizado." : "Orçamento criado.");
                reload();
            } catch {
                setError("Falha na comunicação com o servidor.");
            } finally {
                setIsSubmitting(false);
            }
        }

// LOCAL FILTER: filter quote list searching by id or client name
        const filtered = quotes.filter(
            (q) =>
                q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    /* ==========================================================================
        RENDERING (JSX)
   ========================================================================== */
        return(
            <div>
                {/* CABEÇALHO DA PÁGINA */}
                <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="mb-1 text-sm font-medium uppercase tracking-[0.15em] text-tp-primary">
                    Comercial
                    </p>
                    <h1 className="text-2xl font-bold text-tp-text-main">Orçamentos</h1>
                </div>
                <Button variant="primary" onClick={() => (showForm ? closeForm() : openCreateForm())}>
                    {showForm ? "Cancelar" : "Novo orçamento"}
                </Button>
                </div>

                {/* GLOBAL ALERT MESSAGES */}
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
                
                {/* CREATION/UPDATE MODAL FORM */}
                <Modal open={showForm} title={editingId ? "Editar orçamento" : "Novo orçamento"} onClose={closeForm}>
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    
                    {/* SELECT CLIENT */}
                    <div className="flex flex-col gap-1.5">
                    <label htmlFor="quote-client" className="text-sm font-semibold text-tp-text-main">
                        Cliente
                    </label>
                    <select
                        id="quote-client"
                        value={formData.clientId}
                        disabled={isSubmitting}
                        onChange={(e) => setFormData((p) => ({ ...p, clientId: e.target.value }))}
                        className="w-full rounded-tp-sm border border-tp-border bg-white px-3 py-2.5 text-base text-tp-text-main focus:outline-none focus:border-tp-primary"
                    >
                        <option value="">Selecione um cliente...</option>
                        {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.name}
                        </option>
                        ))}
                    </select>
                    {fieldErrors["clientId"] ? (
                        <span className="text-xs text-tp-danger">{fieldErrors["clientId"]}</span>
                    ) : null}
                    </div>

                    {/* DYNAMIC ITEMS LIST */}
                    <div className="flex flex-col gap-3 border-t border-b border-tp-border-light py-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-tp-text-main">Itens do Orçamento</h3>
                        <Button type="button" variant="ghost" onClick={addItem}>
                        + Adicionar item
                        </Button>
                    </div>

                    {formData.items.map((item, index) => (
                        <div key={index} className="flex flex-col gap-2 rounded border border-tp-border-light p-3 bg-tp-neutral-50">
                        <div className="flex items-center gap-2">
                            <select
                            value={item.type}
                            onChange={(e) => updateItem(index, "type", e.target.value as QuoteItemType)}
                            className="rounded border border-tp-border px-2 py-1 text-sm bg-white"
                            >
                                <option value="SERVICE">Serviço</option>
                                <option value="PRODUCT">Produto</option>
                                <option value="OTHER">Outro</option>
                            </select>

                            <input
                                type="text"
                                placeholder="Descrição do item..."
                                value={item.description}
                                onChange={(e) => updateItem(index, "description", e.target.value)}
                                className="flex-1 rounded border border-tp-border px-2 py-1 text-sm bg-white"
                            />

                            {formData.items.length > 1 ? (
                            <Button type="button" variant="ghost" onClick={() => removeItem(index)}>
                                Remover
                            </Button>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <Field
                            id={`qty-${index}`}
                            label="Qtd"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            />
                            <Field
                            id={`price-${index}`}
                            label="Preço Un."
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                            />
                            <Field
                            id={`disc-${index}`}
                            label="Desc. Item"
                            value={item.discount ?? "0"}
                            onChange={(e) => updateItem(index, "discount", e.target.value)}
                            />
                        </div>
                        </div>
                    ))}
                    {fieldErrors["items"] ? (
                        <span className="text-xs text-tp-danger">{fieldErrors["items"]}</span>
                    ) : null}
                    </div>

                    {/* OBSERVATIONS */}
                    <Field
                    id="quote-notes"
                    label="Observações / Notas"
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    />

                    {/* SUBMISSION BUTTON */}
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    {editingId ? "Salvar alterações" : "Criar orçamento"}
                    </Button>
                </form>
                </Modal>

                {/* FILTER/FILTER FIELD */}
                <div className="mb-4">
                <Field
                    id="quote-search"
                    label="Buscar"
                    type="search"
                    placeholder="Buscar por código ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>

                {/* QUOTE LIST (TABLE) */}
                {isLoading ? (
                <p className="text-tp-text-muted">Carregando orçamentos...</p>
                ) : filtered.length === 0 ? (
                <div className="rounded-tp-md border border-dashed border-tp-border bg-white px-5 py-8 text-center text-sm text-tp-text-muted">
                    Nenhum orçamento encontrado.
                </div>
                ) : (
                <div className="overflow-x-auto rounded-tp-md border border-tp-border bg-white">
                    <table className="w-full text-left text-sm">
                    <thead className="border-b border-tp-border-light bg-tp-neutral-50">
                        <tr>
                        <th className="px-4 py-3 font-semibold text-tp-text-main">Código</th>
                        <th className="px-4 py-3 font-semibold text-tp-text-main">Cliente</th>
                        <th className="px-4 py-3 font-semibold text-tp-text-main">Valor Total</th>
                        <th className="px-4 py-3 font-semibold text-tp-text-main">Status</th>
                        <th className="px-4 py-3 text-right font-semibold text-tp-text-main">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-tp-border-light">
                        {filtered.map((quote) => (
                        <tr key={quote.id} className="hover:bg-tp-neutral-50">
                            <td className="px-4 py-3 font-medium text-tp-text-main">
                                {quote.id.slice(0, 8)}...
                            </td>
                            <td className="px-4 py-3 text-tp-text-body">
                                {quote.client?.name ?? "Cliente não informado"}
                            </td>
                            <td className="px-4 py-3 font-medium text-tp-text-main">
                                {formatCurrency(quote.total)}
                            </td>
                            <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-tp-neutral-100 px-2.5 py-0.5 text-xs font-medium text-tp-text-main">
                                {quote.status}
                            </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                            <Button variant="ghost">Visualizar</Button>
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