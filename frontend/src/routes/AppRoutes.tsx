import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import PortalPage from "../pages/PortalPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/pdv"
        element={
          <PortalPage
            accent="blue"
            title="Panel de Punto de Venta"
            description="Aquí puede continuar el desarrollo del flujo para cajeros, registro de pedidos y cobro en mostrador."
          />
        }
      />
      <Route
        path="/cocina"
        element={
          <PortalPage
            accent="orange"
            title="Panel de Cocina"
            description="Esta ruta queda preparada para la vista de comandas, estados de preparación y control del despacho."
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <PortalPage
            accent="stone"
            title="Dashboard Administrativo"
            description="Esta pantalla puede crecer con indicadores, control de usuarios, reportes y la gestión general del sistema."
          />
        }
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

export default AppRoutes;
