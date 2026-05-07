/**
 * Imagen accesible con:
 * - Tamaños adaptables
 * - Accesibilidad WCAG
 */

import { useAccessibilityContext } from "../contexts/AccessibilityContext";

interface AccessibleImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  altText: string;
  fallback?: string;
  objectFit?: "cover" | "contain" | "fill";
  aspectRatio?: "square" | "video" | "auto";
}

export default function AccessibleImage({
  altText,
  fallback = "🖼️",
  objectFit = "cover",
  aspectRatio = "square",
  className = "",
  src,
  ...props
}: AccessibleImageProps) {
  const { isAccessible } = useAccessibilityContext();

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: ""
  };

  const objectFitClasses = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill"
  };

  const borderClass = isAccessible
    ? "border-3 border-slate-900"
    : "border-1 border-slate-200";

  const finalClassName = [
    "w-full",
    "bg-slate-100",
    borderClass,
    "rounded-lg",
    aspectRatioClasses[aspectRatio],
    objectFitClasses[objectFit],
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      src={src}
      alt={altText}
      className={finalClassName}
      {...props}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        const fallbackEl = document.createElement("div");
        fallbackEl.className =
          "flex items-center justify-center w-full h-full text-4xl bg-slate-100 " +
          borderClass;
        fallbackEl.textContent = fallback;
        fallbackEl.setAttribute("aria-label", altText);
        target.parentNode?.replaceChild(fallbackEl, target);
      }}
    />
  );
}
