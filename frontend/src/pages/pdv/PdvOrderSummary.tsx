import { formatCurrency } from "../../utils/pdv";
import { usePdvViewContext } from "./PdvViewContext";

function PdvOrderSummary() {
  const { pedidoDetalles, removeProduct } = usePdvViewContext();

  return (
    <div className="min-h-[260px] flex-1 overflow-y-auto border-b border-dashed border-slate-300 bg-white p-3">
      {pedidoDetalles.length === 0 ? (
        <div className="flex h-full min-h-[360px] items-center justify-center text-center text-sm text-slate-500">
          Agrega productos antes de aceptar el pedido
        </div>
      ) : (
        <div className="space-y-2">
          {pedidoDetalles.map((item) => (
            <div key={item.itemKey} className="grid grid-cols-[1fr_auto] gap-2 border-b border-slate-100 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">{item.producto.nombre}</p>
                {item.variante && <p className="text-xs font-black text-yellow-700">Opción: {item.variante.nombre}</p>}
                {item.personalizacion?.combinacion && (
                  <p className="text-xs font-black text-yellow-700">
                    Combinación: {item.personalizacion.combinacion.nombre}
                  </p>
                )}
                {item.personalizacion?.aderezos.length ? (
                  <p className="text-xs text-slate-600">Aderezos: {item.personalizacion.aderezos.join(", ")}</p>
                ) : null}
                {item.personalizacion?.comentario && (
                  <p className="text-xs italic text-slate-600">“{item.personalizacion.comentario}”</p>
                )}
                <p className="text-xs text-slate-600">
                  {item.cantidad} x {formatCurrency(item.producto.precio)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-bold">{formatCurrency(item.subtotal)}</p>
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
