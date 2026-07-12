import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getRouteMeta } from "../config/navigation";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import useActionVoice from "../hooks/useActionVoice";

const ROUTE_MESSAGES: Record<string, string> = {
  "/pdv": "Nuevo pedido. Busca productos, arma el pedido, elige pago y registra la venta.",
  "/modo-facil": "Modo fácil. Elige una acción principal con botones grandes.",
  "/pdv/facil":
    "Nuevo pedido en modo fácil. Sigue los pasos: categoría, producto, revisión, observación, pago y registro.",
  "/pedidos": "Pedidos. Revisa pedidos activos, cambia estados y consulta detalles.",
  "/pedidos/facil":
    "Pedidos en modo fácil. Usa filtros grandes para revisar pendientes, en preparación, listos, entregados o cancelados.",
  "/cierre-turno": "Cierre de turno. Revisa ventas confirmadas, métodos de pago, productos vendidos y cierre de caja.",
  "/cierre-turno/facil": "Cierre de turno en modo fácil. Revisa el turno actual y confirma el cierre.",
  "/productos": "Productos. Revisa el catálogo, disponibilidad, precios y categorías.",
  "/productos/facil":
    "Productos en modo fácil. Revisa productos con tarjetas grandes y puedes enviarlos a nuevo pedido.",
  "/inventario/facil": "Inventario en modo fácil. Revisa productos disponibles, bajo stock o agotados.",
  "/clientes": "Clientes. Revisa registro, segmentos y estado de clientes.",
  "/cocina": "Cocina. Vista general para preparar y organizar comandas.",
  "/preparacion/facil": "Preparación en modo fácil. Aquí aparecen los pedidos que deben prepararse.",
  "/cocina/facil": "Preparación en modo fácil. Aquí aparecen los pedidos que deben prepararse.",
  "/historial-pedidos": "Historial de turnos. Consulta turnos cerrados, ventas confirmadas y pedidos registrados.",
  "/inventario": "Inventario. Control de stock y disponibilidad."
};

export function getRouteMessage(pathname: string) {
  const explicitMessage = ROUTE_MESSAGES[pathname];

  if (explicitMessage) {
    return explicitMessage;
  }

  const meta = getRouteMeta(pathname);

  if (!meta) {
    return "Seccion del sistema.";
  }

  return `${meta.label}. ${meta.description}.`;
}

function AccessibleRouteAnnouncer() {
  const location = useLocation();
  const { isAccessible, isVoiceEnabled } = useAccessibilityContext();
  const { speakAction } = useActionVoice(isVoiceEnabled);
  const [liveMessage, setLiveMessage] = useState("");

  const message = useMemo(() => getRouteMessage(location.pathname), [location.pathname]);

  useEffect(() => {
    setLiveMessage(message);
    if (isAccessible) {
      speakAction(message, `route:${location.pathname}`, { cooldownMs: 900 });
    }
  }, [isAccessible, location.pathname, message, speakAction]);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {liveMessage}
    </div>
  );
}

export default AccessibleRouteAnnouncer;
