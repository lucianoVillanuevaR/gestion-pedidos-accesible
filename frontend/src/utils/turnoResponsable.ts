import type { TurnoResponsable } from "../types";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  administrador: "Administrador",
  cajero: "Cajero",
  cocina: "Cocina"
};

export type ResponsableDisplay = {
  primaryLabel: "Responsable" | "Usuario";
  primaryValue: string;
  roleValue?: string;
};

function cleanText(value?: string | null) {
  return value?.trim() || "";
}

function formatRole(value?: string | null) {
  const cleanValue = cleanText(value).toLowerCase();
  return ROLE_LABELS[cleanValue] ?? capitalizeWords(cleanText(value));
}

function isRoleLikeLabel(label: string, role?: string | null) {
  const normalizedLabel = label.toLowerCase();
  const normalizedRole = cleanText(role).toLowerCase();
  return normalizedLabel === normalizedRole || normalizedLabel === ROLE_LABELS[normalizedRole]?.toLowerCase();
}

function capitalizeWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("es-CL") + word.slice(1))
    .join(" ");
}

export function getResponsableDisplay(
  responsable?: TurnoResponsable,
  legacyUsername?: string | null
): ResponsableDisplay {
  const label = cleanText(responsable?.label);
  const username = cleanText(responsable?.username ?? legacyUsername);
  const role = cleanText(responsable?.role);

  if (label && !isRoleLikeLabel(label, role)) {
    return {
      primaryLabel: "Responsable",
      primaryValue: capitalizeWords(label),
      roleValue: role ? formatRole(role) : undefined
    };
  }

  if (username) {
    return {
      primaryLabel: "Usuario",
      primaryValue: username,
      roleValue: role ? formatRole(role) : undefined
    };
  }

  return {
    primaryLabel: "Responsable",
    primaryValue: role ? formatRole(role) : "No identificado"
  };
}
