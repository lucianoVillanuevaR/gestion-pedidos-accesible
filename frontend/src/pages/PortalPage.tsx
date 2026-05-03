import { Link } from "react-router-dom";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";

type PortalPageProps = {
  accent: "blue" | "orange" | "stone";
  description: string;
  title: string;
};

const accentClasses = {
  blue: {
    badge: "bg-blue-100 text-blue-800",
    button: "bg-blue-600 text-white hover:bg-blue-700"
  },
  orange: {
    badge: "bg-orange-100 text-orange-800",
    button: "bg-orange-500 text-white hover:bg-orange-600"
  },
  stone: {
    badge: "bg-stone-200 text-stone-800",
    button: "bg-stone-900 text-white hover:bg-stone-800"
  }
};

function PortalPage({ accent, description, title }: PortalPageProps) {
  const { isAccessible, isHighContrast } = useAccessibilityContext();

  const actionCards = [
    {
      title: "Tomar pedido",
      description: "Registrar un pedido nuevo.",
      button: "Ingresar"
    },
    {
      title: "Cobrar pedido",
      description: "Ver y pagar pedidos pendientes.",
      button: "Pagar"
    },
    {
      title: "Cancelar pedido",
      description: "Anular un pedido con aviso claro.",
      button: "Cancelar"
    }
  ];

  return (
    <main
      className={`min-h-screen px-4 py-6 sm:px-6 sm:py-8 ${
        isAccessible
          ? isHighContrast
            ? "bg-[#f5f5f5] text-black"
            : "bg-[#f7f7f7] text-slate-900"
          : "bg-[linear-gradient(160deg,#fff7ed_0%,#fffbeb_40%,#ffffff_100%)] text-stone-900"
      }`}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[260px_1fr]">
        <aside
          className={`rounded-2xl p-5 ${
            isAccessible
              ? "border-4 border-black bg-white"
              : "border border-stone-200 bg-white shadow-lg"
          }`}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                Riquísimo S.P.A
              </p>
              <h1 className={`mt-2 font-black ${isAccessible ? "text-[32px]" : "text-3xl"}`}>
                {title}
              </h1>
              <p className={`mt-2 ${isAccessible ? "text-lg text-black" : "text-sm text-stone-600"}`}>
                {description}
              </p>
            </div>

            <nav className="space-y-2" aria-label="Navegación principal">
              {[
                "Pedidos",
                "Caja",
                "Cocina",
                "Inventario",
                "Usuarios",
                "Salir"
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`flex min-h-[56px] w-full items-center justify-start rounded-xl px-4 text-left font-semibold transition ${
                    isAccessible
                      ? "border-2 border-black bg-white text-black hover:bg-gray-100 text-lg"
                      : "border border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100 text-base"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <section
          className={`rounded-2xl p-5 sm:p-6 ${
            isAccessible
              ? "border-4 border-black bg-white"
              : "border border-stone-200 bg-white shadow-2xl shadow-stone-200/60"
          }`}
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${
                  accentClasses[accent].badge
                }`}
              >
                Vista lista
              </span>
              <p className={`${isAccessible ? "text-lg text-black" : "text-sm text-stone-600"}`}>
                Modo accesible pensado para lectura clara y acciones simples.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {actionCards.map((card) => (
                <article
                  key={card.title}
                  className={`rounded-2xl p-4 ${
                    isAccessible
                      ? "border-2 border-black bg-gray-50"
                      : "border border-stone-200 bg-stone-50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className={`h-24 rounded-xl ${isAccessible ? "bg-gray-200" : "bg-stone-200"}`} />
                    <h2 className={`font-bold ${isAccessible ? "text-2xl" : "text-xl"}`}>
                      {card.title}
                    </h2>
                    <p className={`${isAccessible ? "text-lg text-black" : "text-sm text-stone-600"}`}>
                      {card.description}
                    </p>
                    <button
                      type="button"
                      className={`min-h-[60px] w-full rounded-xl px-4 font-bold transition ${
                        card.button === "Cancelar"
                          ? isAccessible
                            ? "border-2 border-black bg-red-600 text-white hover:bg-red-700 text-lg"
                            : "bg-red-600 text-white hover:bg-red-700"
                          : card.button === "Pagar"
                            ? isAccessible
                              ? "border-2 border-black bg-green-600 text-white hover:bg-green-700 text-lg"
                              : "bg-green-600 text-white hover:bg-green-700"
                            : isAccessible
                              ? "border-2 border-black bg-blue-600 text-white hover:bg-blue-700 text-lg"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {card.button}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div
              className={`rounded-2xl p-4 ${
                isAccessible
                  ? "border-2 border-black bg-yellow-50"
                  : "border border-stone-200 bg-white"
              }`}
            >
              <p className={`font-bold ${isAccessible ? "text-xl" : "text-lg"}`}>
                Feedback del sistema
              </p>
              <p className={`${isAccessible ? "text-lg text-black" : "text-sm text-stone-600"}`}>
                Producto agregado. Pedido enviado. Error al guardar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default PortalPage;
