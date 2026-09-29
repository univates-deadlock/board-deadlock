import Image from "next/image";

export function LoginBrandPanel() {
  return (
    <section
      aria-hidden="true"
      className="relative isolate flex min-h-64 items-center justify-center overflow-hidden px-6 py-10 text-white lg:min-h-full lg:px-12"
      style={{ background: "var(--tp-login-gradient)" }}
    >
      <Image
        src="/monitoring-center.webp"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover opacity-25"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "var(--tp-login-gradient)", opacity: 0.82 }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5 lg:gap-7">
        <Image
          src="/white-techpro-lock.png"
          alt=""
          width={180}
          height={180}
          priority
          className="h-auto w-24 lg:w-44"
        />
        <Image
          src="/white-techpro-writing.png"
          alt=""
          width={280}
          height={70}
          priority
          className="h-auto w-48 lg:w-64"
        />
      </div>
    </section>
  );
}
