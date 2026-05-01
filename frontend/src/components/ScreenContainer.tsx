import type { PropsWithChildren } from "react";

function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 px-6 py-12">
      <section className="w-full max-w-3xl rounded-3xl border border-amber-100 bg-white p-10 shadow-lg shadow-stone-200/60">
        {children}
      </section>
    </main>
  );
}

export default ScreenContainer;

