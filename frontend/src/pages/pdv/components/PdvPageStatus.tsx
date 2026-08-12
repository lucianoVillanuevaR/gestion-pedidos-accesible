import { LoaderCircle } from "lucide-react";
import PdvFeedbackMessage from "./PdvFeedbackMessage";

type PdvPageStatusProps = {
  isAccessible: boolean;
  isHighContrast: boolean;
  loadingError: string | null;
  loadingProductos: boolean;
  onRetryProducts: () => void;
};

function PdvPageStatus({
  isAccessible,
  isHighContrast,
  loadingError,
  loadingProductos,
  onRetryProducts
}: PdvPageStatusProps) {
  return (
    <>
      {loadingProductos && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-6 flex items-center gap-4 rounded-2xl p-6 ${
            isAccessible ? "bg-white border-2 border-slate-900" : "bg-[#FFF8DC] border border-[#FFF4BF]"
          }`}
        >
          <LoaderCircle className="h-10 w-10 animate-spin" aria-hidden="true" />
          <p className={`font-bold ${isAccessible ? "text-xl" : "text-lg"}`}>Cargando productos...</p>
        </div>
      )}

      {loadingError && (
        <PdvFeedbackMessage
          className="mb-6"
          feedback={{
            type: "error",
            title: "No se pudieron cargar los productos",
            message: loadingError,
            details: "Revisa la conexión e intenta nuevamente."
          }}
          isAccessible={isAccessible}
          isHighContrast={isHighContrast}
          onRetry={onRetryProducts}
        />
      )}
    </>
  );
}

export default PdvPageStatus;
