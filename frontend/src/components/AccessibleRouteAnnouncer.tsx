import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getRouteMeta } from "../config/navigation";

const ROUTE_MESSAGES: Record<string, string> = {
  "/inicio": "Inicio. Resumen general del sistema.",
  "/pdv": "Nuevo pedido. Busca productos, arma el pedido, elige pago y registra la venta.",
  "/pdv/facil": "Nuevo pedido en modo facil. Sigue los pasos: categoria, producto, revision, observacion, pago y registro.",
  "/pedidos": "Pedidos. Revisa pedidos activos, cambia estados y consulta detalles.",
  "/pedidos/facil": "Pedidos en modo facil. Usa filtros grandes para revisar pendientes, en preparacion, listos, entregados o cancelados.",
  "/productos": "Productos. Revisa el catalogo, disponibilidad, precios y categorias.",
  "/productos/facil": "Productos en modo facil. Revisa productos con tarjetas grandes y puedes enviarlos a nuevo pedido.",
  "/cocina": "Cocina. Vista general para preparar y organizar comandas.",
  "/cocina/pendientes": "Pedidos pendientes. Comandas que faltan por preparar.",
  "/cocina/listos": "Pedidos listos. Comandas preparadas para entregar.",
  "/inventario": "Inventario. Control de stock y disponibilidad.",
  "/ventas": "Ventas. Indicadores y resumen del turno.",
  "/configuracion": "Configuracion. Ajustes del sistema, usuarios y permisos."
};

function getRouteMessage(pathname: string) {
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
  const [liveMessage, setLiveMessage] = useState("");

  const message = useMemo(() => getRouteMessage(location.pathname), [location.pathname]);

  useEffect(() => {
    setLiveMessage(message);
  }, [message]);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {liveMessage}
    </div>
  );
}

export default AccessibleRouteAnnouncer;
