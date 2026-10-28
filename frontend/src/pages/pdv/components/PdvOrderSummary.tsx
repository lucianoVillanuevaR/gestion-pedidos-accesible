import { ShoppingBasket } from "lucide-react";
import { formatCurrency } from "../../../utils/pdv";
import { usePdvViewContext } from "../PdvViewContext";

function PdvOrderSummary() {
  const { pedidoDetalles, removeProduct } = usePdvViewContext();

  return (
    <div
      className="min-h-[240px] flex-1 overflow-visible border-b border-dashed border-slate-300 bg-white p-3 lg:min-h-0 lg:overflow-y-auto"
      tabIndex={0}
      aria-label="Productos del pedido"
    >
      {pedidoDetalles.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-4 text-center text-slate-500">
          <ShoppingBasket className="mb-3 h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-700">No hay productos en el pedido</p>
          <p className="mt-1 max-w-xs text-sm">Selecciona productos del catálogo para comenzar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pedidoDetalles.map((item) => (
            <div
              key={item.itemKey}
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 border-b border-slate-100 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold text-slate-950">{item.producto.nombre}</p>
                {item.variante && (
                  <p className="break-words text-xs font-black text-yellow-700">Opción: {item.variante.nombre}</p>
                )}
                {item.personalizacion?.combinacion && (
                  <p className="break-words text-xs font-black text-yellow-700">
                    Combinación: {item.personalizacion.combinacion.nombre}
                  </p>
                )}
                {item.personalizacion?.aderezos.length ? (
                  <p className="break-words text-xs text-slate-600">
                    Aderezos: {item.personalizacion.aderezos.join(", ")}
                  </p>
                ) : null}
                {item.personalizacion?.comentario && (
                  <p className="break-words text-xs italic text-slate-600">“{item.personalizacion.comentario}”</p>
                )}
                <p className="text-xs text-slate-600">
                  {item.cantidad} x {formatCurrency(item.producto.precio)}
                </p>
              </div>
              <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5">
                <p className="whitespace-nowrap text-sm font-bold">{formatCurrency(item.subtotal)}</p>
                <button
                  type="button"
                  onClick={() => removeProduct(item.itemKey)}
                  className="rounded p-1 text-lg transition hover:bg-red-50 hover:opacity-70"
                  title={`Eliminar ${item.producto.nombre}`}
                  aria-label={`Eliminar ${item.producto.nombre} del pedido`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PdvOrderSummary;
