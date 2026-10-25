/**
 * Currency and date helpers for quote screens.
 *
 * Money is handled in integer cents end to end (never floating point) and
 * only formatted for display. The API stores the Decimal columns with two
 * decimal places; lib/quotes.ts converts them to cents at the boundary.
 */

/** Formats integer cents as Brazilian currency ("1.234,56"). */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents ?? 0) / 100);
}

/**
 * Parses typed text into cents. Accepts "1.234,56", "1234,56", "1234.56",
 * "R$ 12" — anything that is not digits, comma or dot is stripped, then the
 * last separator (if any) is treated as the decimal separator.
 *
 * Returns null when the text has no digits at all.
 */
export function parseMoneyToCents(text: string): number | null {
  const cleaned = (text ?? "").replace(/[^\d,.]/g, "");
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const lastSep = Math.max(lastComma, lastDot);

  let wholeDigits = cleaned;
  let decimalDigits = "";

  if (lastSep !== -1) {
    /* Everything before the last separator is the whole part; earlier
       separators (thousands) are dropped. */
    wholeDigits = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
    /* Only digits after the separator count; extra decimals are truncated. */
    decimalDigits = cleaned.slice(lastSep + 1).replace(/\D/g, "");
  }

  const whole = Number.parseInt(wholeDigits || "0", 10);
  const decimals = Number.parseInt((decimalDigits + "00").slice(0, 2), 10);
  return whole * 100 + decimals;
}

/**
 * Formats cents for a money input: thousands separated with dots and up to
 * two decimal places after a comma ("12.345,67"). Empty text stays empty.
 */
export function maskMoney(cents: number | null): string {
  if (cents === null || Number.isNaN(cents)) return "";
  const whole = Math.trunc(Math.abs(cents) / 100);
  const decimals = Math.abs(cents) % 100;
  const wholeFmt = whole.toLocaleString("pt-BR");
  return `${wholeFmt},${String(decimals).padStart(2, "0")}`;
}

/** Formats a quantity (up to 2 decimal places, pt-BR) for display. */
export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Formats "2026-03-01T10:00:00.000Z" style dates as "01/03/2026". */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Same as formatDate but includes the time ("01/03/2026 10:04"). */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}