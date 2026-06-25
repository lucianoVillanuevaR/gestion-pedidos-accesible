export type PortalAction = {
  button: string;
  description: string;
  title: string;
};

export type PortalStat = {
  label: string;
  value: string;
};

export type PortalAccent = "yellow" | "slate";

export const accentStyles: Record<PortalAccent, { badge: string; button: string }> = {
  yellow: {
    badge: "bg-[#FECE00] text-slate-950 border-yellow-200",
    button: "bg-slate-900 text-white hover:bg-black"
  },
  slate: {
    badge: "bg-slate-900 text-white border-slate-700",
    button: "bg-slate-800 text-white hover:bg-slate-900"
  }
};
