import { LoginBrandPanel } from "@/components/login/LoginBrandPanel";
import { LoginForm } from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid flex-1 grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      <LoginBrandPanel />
      <section className="flex items-center justify-center bg-tp-neutral-50 px-5 py-12 md:px-10">
        <LoginForm />
      </section>
    </main>
  );
}
