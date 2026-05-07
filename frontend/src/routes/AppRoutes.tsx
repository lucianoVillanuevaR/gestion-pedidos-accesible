import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import PortalPage from "../pages/PortalPage";
import PdvPage from "../pages/PdvPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pdv" element={<PdvPage />} />
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
