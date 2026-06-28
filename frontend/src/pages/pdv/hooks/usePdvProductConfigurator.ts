import { useEffect, useRef, useState } from "react";
import type { Producto } from "../../../types";
import { buildPromoCombinations } from "../../../utils/promoCombinations";
import { PEDIDO_MAX_CANTIDAD_DETALLE } from "../../../validations/pedido.validation";

export const ADEREZOS_DISPONIBLES = ["Mostaza", "Mayonesa", "Ketchup", "Poca mayo"];
export const PRODUCT_COMMENT_MAX_LENGTH = 200;

export function usePdvProductConfigurator(producto: Producto, isAccessible: boolean) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedCombinationIndex, setSelectedCombinationIndex] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [aderezos, setAderezos] = useState<string[]>([]);
  const [comentario, setComentario] = useState("");
  const [easyConfigStep, setEasyConfigStep] = useState(0);
  const easyHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const varianteSeleccionada = producto.variantes?.find((variante) => variante.id === selectedVariantId);
  const variantesDisponibles = producto.variantes?.filter((item) => item.disponible !== false) ?? [];
  const combinacionesDisponibles = buildPromoCombinations(producto);
  const combinacionSeleccionada =
    selectedCombinationIndex == null ? undefined : combinacionesDisponibles[selectedCombinationIndex];
  const requiereOpcion = variantesDisponibles.length > 0 || combinacionesDisponibles.length > 0;
  const esSandwich = producto.nombre.toLocaleLowerCase("es").includes("sandwich");
  const total = producto.precio * cantidad;
  const easySteps: Array<"opcion" | "aderezos" | "confirmar"> = requiereOpcion
    ? ["opcion", "aderezos", "confirmar"]
    : ["aderezos", "confirmar"];
  const easyStage = easySteps[easyConfigStep];
  const opcionSeleccionada = Boolean(varianteSeleccionada || combinacionSeleccionada);
  const canContinueEasy = easyStage !== "opcion" || opcionSeleccionada;

  const opcionesConfigurables = combinacionesDisponibles.length
    ? combinacionesDisponibles.map((combinacion, index) => ({
        key: `combinacion-${index}`,
        nombre: combinacion.nombre,
        selected: selectedCombinationIndex === index,
        select: () => setSelectedCombinationIndex(index)
      }))
    : variantesDisponibles.map((variante) => ({
        key: `variante-${variante.id}`,
        nombre: variante.nombre,
        selected: selectedVariantId === variante.id,
        select: () => setSelectedVariantId(variante.id)
      }));

  const toggleAderezo = (aderezo: string) => {
    setAderezos((current) =>
      current.includes(aderezo) ? current.filter((item) => item !== aderezo) : [...current, aderezo]
    );
  };

  const decreaseCantidad = () => {
    setCantidad((current) => Math.max(1, current - 1));
  };

  const increaseCantidad = () => {
    setCantidad((current) => Math.min(PEDIDO_MAX_CANTIDAD_DETALLE, current + 1));
  };

  useEffect(() => {
    if (isAccessible) {
      easyHeadingRef.current?.focus();
    }
  }, [easyConfigStep, isAccessible]);

  return {
    aderezos,
    canContinueEasy,
    cantidad,
    combinacionSeleccionada,
    decreaseCantidad,
    easyConfigStep,
    easyHeadingRef,
    easyStage,
    easySteps,
    esSandwich,
    increaseCantidad,
    opcionSeleccionada,
    opcionesConfigurables,
    requiereOpcion,
    setComentario,
    setEasyConfigStep,
    toggleAderezo,
    total,
    varianteSeleccionada,
    comentario
  };
}

export type PdvProductConfiguratorState = ReturnType<typeof usePdvProductConfigurator>;
