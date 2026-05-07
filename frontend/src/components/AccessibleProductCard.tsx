/**
 * Tarjeta de producto accesible con:
 * - Dos experiencias visuales diferenciadas
 * - Imágenes grandes en modo accesible
 * - Alto contraste y bordes claros
 * - Navegación completa por teclado
 * - Etiquetas ARIA descriptivas
 * - Soporte para cantidad y control
 */

import React, { useState } from "react";
import { useAccessibilityContext } from "../contexts/AccessibilityContext";
import AccessibleImage from "./AccessibleImage";
import useVoice from "../hooks/useVoice";

interface AccessibleProductCardProps {
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string | null;
  imagen?: string | null;
  altText?: string;
  categoria?: string;
  cantidad?: number;
  onIncrease?: () => void;
  onDecrease?: () => void;
  onAdd?: () => void;
  categoryIcon?: string;
}

export default function AccessibleProductCard({
  id,
  nombre,
  precio,
  descripcion,
  imagen,
  altText,
  categoria,
  cantidad = 0,
  onIncrease,
  onDecrease,
  onAdd,
  categoryIcon
}: AccessibleProductCardProps) {
  const { isAccessible, isHighContrast, isVoiceEnabled } =
    useAccessibilityContext();
  const { speak } = useVoice({ enabled: isVoiceEnabled });
  const [isFocused, setIsFocused] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0
    }).format(value);
  };

  // Clases según modo
  const cardClass = isAccessible
    ? "bg-white border-3 border-slate-900 rounded-3xl shadow-lg overflow-hidden"
    : isHighContrast
      ? "bg-white border-2 border-slate-800 rounded-xl shadow-md overflow-hidden"
      : "bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition";

  const imageHeightClass = isAccessible ? "h-48" : "h-32";
  const imagePaddingClass = isAccessible ? "p-4" : "p-2";
  const imageBgClass = isAccessible
    ? "bg-slate-100 border-b-3 border-slate-900"
    : isHighContrast
      ? "bg-slate-200 border-b-2 border-slate-800"
      : "bg-gradient-to-br from-slate-50 to-slate-100 border-b";

  const contentPaddingClass = isAccessible ? "p-6" : "p-4";
  const categoryBadgeClass = isAccessible
    ? "inline-block px-3 py-2 rounded-lg border-2 border-slate-900 bg-slate-100 font-bold text-lg text-slate-900"
    : isHighContrast
      ? "inline-block px-3 py-1 rounded-full border border-slate-800 bg-slate-100 font-bold text-xs uppercase text-slate-900"
      : "inline-block px-3 py-1 rounded-full border border-amber-200 bg-amber-50 font-bold text-xs uppercase text-amber-900";

  const titleClass = isAccessible ? "text-2xl font-black" : "text-lg font-bold";
  const descriptionClass = isAccessible ? "text-lg" : "text-sm";
  const priceClass = isAccessible ? "text-3xl font-black" : "text-2xl font-bold";
  const buttonClass = isAccessible
    ? "px-6 py-3 text-lg font-bold rounded-lg border-2 border-slate-900 min-h-[56px]"
    : "px-4 py-2 text-base font-bold rounded-lg border min-h-[48px]";

  const dividerClass = isAccessible
    ? "border-t-2 border-slate-300"
    : "border-t border-slate-200";

  return (
    <article
      className={`flex h-full flex-col ${cardClass} ${
        isFocused
          ? isAccessible
            ? "ring-4 ring-blue-500 ring-offset-2"
            : "ring-2 ring-blue-400 ring-offset-1"
          : ""
      }`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Imagen del Producto */}
      {imagen && (
        <div
          className={`${imageHeightClass} flex items-center justify-center ${imageBgClass} ${imagePaddingClass}`}
        >
          <AccessibleImage
            src={imagen}
            altText={altText || nombre}
            fallback={categoryIcon || "🍔"}
            objectFit="contain"
            className="max-h-full max-w-full"
          />
        </div>
      )}

      {/* Contenido de Producto */}
      <div className={`flex-1 flex flex-col ${contentPaddingClass}`}>
        {/* Categoría */}
        {categoria && (
          <span className={categoryBadgeClass}>
            {categoryIcon} {categoria}
          </span>
        )}

        {/* Nombre y Descripción */}
        <div className={isAccessible ? "mt-4" : "mt-3"}>
          <h3 className={`text-slate-900 leading-tight ${titleClass}`}>
            {nombre}
          </h3>
          {descripcion && (
            <p className={`text-slate-600 ${descriptionClass} ${isAccessible ? "mt-3" : "mt-2"}`}>
              {descripcion}
            </p>
          )}
        </div>

        {/* Precio */}
        <div className={`${dividerClass} ${isAccessible ? "my-4 py-4" : "my-3 py-3"}`}>
          <p className={`text-slate-900 ${priceClass}`}>
            {formatCurrency(precio)}
          </p>
        </div>

        {/* Controles de Cantidad */}
        <div className="mt-auto">
          {cantidad > 0 ? (
            <div
              className={`
                grid grid-cols-[1fr_auto_1fr] items-center gap-2
                rounded-lg p-2
                ${isAccessible
                  ? "bg-slate-100 border-2 border-slate-900"
                  : "bg-slate-50 border border-slate-200"
                }
              `}
            >
              <button
                type="button"
                onClick={() => {
                  onDecrease?.();
                  speak(`${nombre}: ${cantidad - 1} unidades`);
                }}
                aria-label={`Disminuir cantidad de ${nombre}`}
                className={`
                  font-bold text-center
                  ${isAccessible ? "text-2xl" : "text-lg"}
                  hover:bg-slate-200 rounded transition
                `}
              >
                −
              </button>

              <span
                className={`font-bold text-center ${isAccessible ? "text-xl" : "text-lg"}`}
                aria-label={`${cantidad} unidades de ${nombre}`}
              >
                {cantidad}
              </span>

              <button
                type="button"
                onClick={() => {
                  onIncrease?.();
                  speak(`${nombre}: ${cantidad + 1} unidades`);
                }}
                aria-label={`Aumentar cantidad de ${nombre}`}
                className={`
                  font-bold text-center
                  ${isAccessible ? "text-2xl" : "text-lg"}
                  hover:bg-slate-200 rounded transition
                `}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onAdd?.();
                speak(`${nombre} agregado al pedido`);
              }}
              aria-label={`Agregar ${nombre} al pedido`}
              className={`
                w-full ${buttonClass}
                text-white font-bold transition
                ${isAccessible
                  ? "bg-slate-900 hover:bg-slate-800 border-slate-900"
                  : isHighContrast
                    ? "bg-blue-700 hover:bg-blue-800 border-blue-700"
                    : "bg-blue-600 hover:bg-blue-700 border-blue-600"
                }
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
              `}
            >
              {isAccessible ? "➕ AGREGAR" : "Agregar"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
