/**
 * Input masks for Brazilian document and phone formats.
 *
 * Masks run on every keystroke, so invalid characters never reach the form
 * state. They are a usability layer only: the API validates again on the
 * server (RNF02), and no business rule depends on the mask being applied.
 *
 * Values are sent to the API as digits only, matching the payloads in
 * api/tests/client.http.
 */

/** Document kind, mirrored from the API ClientType enum. */
export type DocumentKind = "INDIVIDUAL" | "COMPANY";

/** Keeps only the digits of a value. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Digits only, capped at `max` characters. */
function digits(value: string, max: number): string {
  return onlyDigits(value).slice(0, max);
}

/** CPF: 000.000.000-00 */
export function maskCpf(value: string): string {
  const d = digits(value, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** CNPJ: 00.000.000/0000-00 */
export function maskCnpj(value: string): string {
  const d = digits(value, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Picks the CPF or CNPJ mask for the given document kind. */
export function maskDocument(value: string, kind: DocumentKind): string {
  return kind === "COMPANY" ? maskCnpj(value) : maskCpf(value);
}

/** Landline (00) 0000-0000 or mobile (00) 00000-0000. */
export function maskPhone(value: string): string {
  const d = digits(value, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
