"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { quoteSchema } from "@/lib/schemas"

type QuoteStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED";
type QuoteItemType = "PRODUCT" | "SERVICE";

type ClientOption = {
    id: string;
    name: string;
}

// Quote item forms estructure
type QuoteItemFormData = {
    type: QuoteItemType;
    description: string;
    quantity: string;
    unitPrice: string;
    discount?: string;
}

// Global quote form structure
type QuoteFormData = {
    clientId: string;
    notes: string;
    discount: string;
    items: QuoteItemFormData[]; // Array of quote items
}

// estructure for quote objects received from the API
type Quote = {
    id: string;
    code?: string;
    clientId: string;
    clientName: string;
    status: QuoteStatus;
    totalValue: number;
    createdAt: string;
} 


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
}

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

/* converts data
    HTML = 'strings' -- API = 'number' (float/integer)
    cleans and converts the object 'QuoteFormData' to the API format
*/
   function toPayload(form: QuoteFormData){
    const parseNum = (val: string) => {
        const clean = val.replace(/[^\d,]/g, "").replace(",", ".");
        return parseFloat(clean) || 0; // return 0 if parsing fails
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

/* ZOD validation
   executes if the payload is valid
   if it has erros, maps the field and returns the error messages in an object
 */
   function validate(form: QuoteFormData): Record<string, string> {
    const payload = toPayload(form); //prepare the types of data
    const result = quoteSchema.safeParse(payload); // tries to validate without throwing an exception
    
    if (result.success) return {}; // no errors, return an empty object

    const errors: Record<string, string> = {};

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
   Page components
   ========================================================================== */

    export function OrcamentosPageQuote() {
        const [quotes, setQuotes] = useState<Quote[]>([]); //list of quotes
        const [clients, setClients] = useState<ClientOption[]>([]); //list of clients for the select input
        const [isLoading, setIsLoading] = useState(true); // state to indicate if the data is still loading (req GET)
        const [error, setError] = useState(""); // error message API request
        const [successMessage, setSuccessMessage] = useState(""); // success message after a creation

        //form state
        const [showForm, setShowForm] = useState(false); // controls if the modal form is open
        const [editingId, setEditingId] = useState<string | null>(null); // stores the ID of the quote being edited, or null if creating a new one
        const [formData, setFormData] = useState<QuoteFormData>(EMPTY_FORM); // validation error in the fields of the form
        const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); //
        const [isSubmitting, setIsSubmitting] = useState(false); // blocks multiples submissions while the request is being processed (POST/PATCH)

        // search and filter state
        const [searchTerm, setSearchTerm] = useState(""); // term used in the search/filter field
        const [reloadKey, setReloadKey] = useState(0); //key to force a reload of the data 

        // effect - Load the list on mount and after every mutation
        useEffect(() => {
            let active = true;

            (async () => {
            setIsLoading(true);
            setError("");
            try {
                // ======== !!!!!! CONFIRMAR ENDPOINTS `/api/quotes` e `/api/clients` batem com as rotas !!!!!! ==================
                const [resQuotes, resClients] = await Promise.all([
                fetch(`${API_BASE}/api/quotes`, { credentials: "include" }),
                fetch(`${API_BASE}/api/clients`, { credentials: "include" }),
                ]);

                if (!active) return; // if the component has unmounted, do not update

                // if the quotes request was successful, parse the JSON and update the state
                if (resQuotes.ok) {
                const quotesData = await resQuotes.json();
                setQuotes(Array.isArray(quotesData) ? quotesData : []);
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
                if (active) setIsLoading(false);
            }
            })();

            // Corrigido: Fechamento da função de cleanup e do array de dependências
            return () => {
            active = false;
            };
        }, [reloadKey]);