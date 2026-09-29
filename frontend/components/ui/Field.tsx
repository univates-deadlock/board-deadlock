import type { InputHTMLAttributes, Ref } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  /** Error message associated with the field; marks the field as invalid when present. */
  error?: string;
  /** Helper text displayed below the field when there is no error. */
  hint?: string;
  /** Allows the page to restore focus to this field after a failed submission. */
  ref?: Ref<HTMLInputElement>;
};

/**
 * Form field with a visible label, helper text, and an accessible error.
 *
 * `aria-describedby` connects the input to its error text, and `aria-invalid`
 * exposes the invalid state so feedback does not rely on border color alone.
 */
export function Field({
  id,
  label,
  error,
  hint,
  className = "",
  ref,
  ...rest
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-tp-text-main">
        {label}
      </label>

      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-tp-sm border bg-white px-3 py-2.5 text-base text-tp-text-main transition-colors placeholder:text-tp-text-muted focus:outline-none disabled:bg-tp-neutral-100 ${
          error
            ? "border-tp-danger focus:border-tp-danger"
            : "border-tp-border focus:border-tp-primary"
        } ${className}`}
        {...rest}
      />

      {error ? (
        <p id={errorId} className="text-sm text-tp-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-tp-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
