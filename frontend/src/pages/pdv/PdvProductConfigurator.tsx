import type { PersonalizacionProducto, Producto, VarianteProducto } from "../../types";
import { usePdvProductConfigurator } from "./hooks/usePdvProductConfigurator";
import PdvProductConfiguratorEasyView from "./PdvProductConfiguratorEasyView";
import PdvProductConfiguratorNormalView from "./PdvProductConfiguratorNormalView";

export default function PdvProductConfigurator({
  isAccessible,
  isHighContrast,
  onClose,
  onSelect,
  producto
}: {
  isAccessible: boolean;
  isHighContrast: boolean;
  onClose: () => void;
  onSelect: (
    variante: VarianteProducto | undefined,
    cantidad: number,
    personalizacion: PersonalizacionProducto
  ) => void;
  producto: Producto;
}) {
  const config = usePdvProductConfigurator(producto, isAccessible);

  if (isAccessible) {
    return (
      <PdvProductConfiguratorEasyView
        config={config}
        isHighContrast={isHighContrast}
        onClose={onClose}
        onSelect={onSelect}
        producto={producto}
      />
    );
  }

  return (
    <PdvProductConfiguratorNormalView
      config={config}
      isHighContrast={isHighContrast}
      onClose={onClose}
      onSelect={onSelect}
      producto={producto}
    />
  );
}
