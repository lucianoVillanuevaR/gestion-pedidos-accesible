import { Utensils } from "lucide-react";
import { useState } from "react";
import { PRODUCT_IMAGE_PLACEHOLDER } from "../../utils/productImages";

type ProductImageProps = {
  alt: string;
  className: string;
  decorative?: boolean;
  emptyClassName: string;
  emptyLabel?: string;
  showEmptyOnError?: boolean;
  src?: string | null;
};

function ProductImage({
  alt,
  className,
  decorative = false,
  emptyClassName,
  emptyLabel = "Sin imagen",
  showEmptyOnError = false,
  src
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || (showEmptyOnError && failedSrc === src)) {
    return (
      <div className={emptyClassName} aria-hidden={decorative || undefined}>
        {emptyLabel === "icon" ? <Utensils className="h-5 w-5" aria-hidden="true" /> : emptyLabel}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      onError={(event) => {
        if (showEmptyOnError) {
          setFailedSrc(src);
          return;
        }
        event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
      }}
      className={className}
      loading="lazy"
    />
  );
}

export default ProductImage;
