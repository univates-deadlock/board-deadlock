import { LoginBrandPanel } from "@/components/login/LoginBrandPanel";
import { LoginForm } from "@/components/login/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error;
  const initialErrorStatus = error && /^(400|401|403|429|503)$/.test(error) ? Number(error) : undefined;

  return (
    <main className="grid flex-1 grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      <LoginBrandPanel />
      <section className="flex items-center justify-center bg-tp-neutral-50 px-5 py-12 md:px-10">
        <LoginForm initialErrorStatus={initialErrorStatus} />
      </section>
    </main>
  );
}
