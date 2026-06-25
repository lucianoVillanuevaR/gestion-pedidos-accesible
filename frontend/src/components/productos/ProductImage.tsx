import { Utensils } from "lucide-react";
import { PRODUCT_IMAGE_PLACEHOLDER } from "../../utils/productImages";

type ProductImageProps = {
  alt: string;
  className: string;
  emptyClassName: string;
  emptyLabel?: string;
  src?: string | null;
};

function ProductImage({ alt, className, emptyClassName, emptyLabel = "Sin imagen", src }: ProductImageProps) {
  if (!src) {
    return (
      <div className={emptyClassName}>
        {emptyLabel === "icon" ? <Utensils className="h-5 w-5" aria-hidden="true" /> : emptyLabel}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={(event) => {
        event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
      }}
      className={className}
      loading="lazy"
    />
  );
}

export default ProductImage;
