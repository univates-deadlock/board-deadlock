export default function DashboardPage() {
  return (
    <div>
      <p className="mb-2 text-sm font-medium uppercase tracking-[0.15em] text-tp-primary">
        Dashboard
      </p>
      <h1 className="mb-3 text-2xl font-bold text-tp-text-main">
        Visão geral
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-tp-text-body">
        A autenticação está ativa. Os indicadores operacionais (orçamentos
        pendentes, serviços próximos, revisões e garantias) entram nas
        próximas entregas, quando a API expuser os endpoints correspondentes.
      </p>
    </div>
  );
}