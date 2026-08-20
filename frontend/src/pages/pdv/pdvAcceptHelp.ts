import type { MetodoPago } from "../../types";

export function getAcceptHelpMessage({
  clienteNombre,
  metodoPago,
  sending,
  validationError
}: {
  clienteNombre: string;
  metodoPago: MetodoPago | "";
  sending: boolean;
  validationError: string | null;
}) {
  if (!validationError || sending) return null;

  if (validationError === "No hay productos seleccionados") {
    return "Agrega al menos un producto para continuar.";
  }

  if (validationError === "Selecciona método de pago") {
    return clienteNombre.trim()
      ? "Selecciona un método de pago para continuar."
      : "Ingresa el nombre del cliente y selecciona un método de pago.";
  }

  if (validationError === "El nombre del cliente es obligatorio") {
    return metodoPago
      ? "Ingresa el nombre del cliente para continuar."
      : "Ingresa el nombre del cliente y selecciona un método de pago.";
  }

  if (validationError === "Debes abrir turno antes de registrar un pedido.") {
    return "Abre el turno para continuar.";
  }

  return validationError.endsWith(".") ? validationError : `${validationError}.`;
}
