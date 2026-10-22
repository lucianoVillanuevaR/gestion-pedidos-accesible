// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Circle } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import SidebarNavItem from "./SidebarNavItem";

const item = {
  allowedRoles: ["cajero" as const],
  description: "Ver pedidos activos",
  icon: Circle,
  label: "Pedidos activos",
  path: "/pedidos"
};

afterEach(cleanup);

describe("SidebarNavItem", () => {
  it("marca semánticamente la página actual con un bloque amarillo rectangular", () => {
    render(
      <MemoryRouter initialEntries={["/pedidos"]}>
        <SidebarNavItem isAccessible={false} isHighContrast={false} item={item} onNavigate={vi.fn()} />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /pedidos activos/i });
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.className).toContain("w-full");
    expect(link.className).toContain("self-stretch");
    expect(link.className).toContain("rounded-none");
    expect(link.className).toContain("bg-[#FECE00]");
    expect(link.className).toContain("hover:bg-[#FFD633]");
    expect(link.className).toContain("active:bg-[#FECE00]");
    expect(link.className).toContain("border-l-[8px]");
    expect(screen.queryByText("Página actual")).toBeNull();
  });

  it("no presenta una opción inactiva como página actual", () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter initialEntries={["/pdv"]}>
        <SidebarNavItem isAccessible={false} isHighContrast={false} item={item} onNavigate={onNavigate} />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /pedidos activos/i });
    expect(link.getAttribute("aria-current")).toBeNull();
    expect(link.className).toContain("w-full");
    expect(link.className).toContain("hover:bg-[#111827]");
    expect(link.className).toContain("hover:text-white");
    expect(link.className).toContain("active:bg-black");
    expect(link.className).toContain("active:text-white");
    expect(link.className).toContain("focus-visible:bg-[#111827]");
    expect(link.className).toContain("touch-manipulation");
    expect(link.className).toContain("transition-colors");
    expect(link.className).toContain("duration-200");
    expect(link.className).toContain("motion-reduce:transition-none");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(screen.queryByText("Página actual")).toBeNull();
  });
});
