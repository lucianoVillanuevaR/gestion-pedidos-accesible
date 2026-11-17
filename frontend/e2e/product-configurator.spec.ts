import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";

async function ensureTestTurn(page: Page) {
  const response = await page.evaluate(async () =>
    fetch("/api/turnos/abrir", {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("riquisimo-auth-token")}` }
    }).then((result) => result.status)
  );
  expect([200, 201, 409]).toContain(response);
}

for (const mode of ["normal", "facil"] as const) {
  test(`configurador ${mode}: fondo oscuro, foco, teclado y cierre`, async ({ page }) => {
    await loginAs(page, "cajero");
    await ensureTestTurn(page);
    await page.goto(mode === "facil" ? "/pdv/facil" : "/pdv");
    await page.getByRole("button", { name: "Completos", exact: true }).first().click();
    const opener = page
      .getByRole("button", {
        name: `${mode === "facil" ? "Aumentar" : "Agregar"} Completo Hass Italiano`,
        exact: true
      })
      .last();
    await opener.focus();
    await opener.click();
    const dialog = page.getByRole("dialog", { name: mode === "facil" ? /Paso 1:/ : "Completo Hass Italiano" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    const backdrop = dialog.locator("..");
    await expect.poll(() => backdrop.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe("none");
    await expect
      .poll(() => backdrop.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toMatch(/rgba\(0, 0, 0, 0\.4\)/);
    const close = dialog.getByRole("button", {
      name: mode === "facil" ? "Cerrar y volver a productos" : "Cerrar configuración"
    });
    if (mode === "facil") {
      await expect(dialog.getByRole("heading", { name: /Paso 1:/ })).toBeFocused();
    } else {
      await expect(close).toBeFocused();
    }
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
}
