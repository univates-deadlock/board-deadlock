/**
 * Placeholder for sections whose backend endpoints are not yet available.
 *
 * Shows a consistent "in development" message so the navigation is complete
 * while making it clear which areas are not functional yet.
 */
export function DevPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium uppercase tracking-[0.15em] text-tp-primary">
        Em desenvolvimento
      </p>
      <h1 className="mb-3 text-2xl font-bold text-tp-text-main">{title}</h1>
      <p className="max-w-2xl text-base leading-relaxed text-tp-text-body">
        {description}
      </p>
      <div className="mt-6 rounded-tp-md border border-dashed border-tp-border bg-white px-5 py-8 text-center">
        <p className="text-sm text-tp-text-muted">
          Esta seção será disponibilizada quando a API expor os endpoints
          correspondentes.
        </p>
      </div>
    </div>
  );
}