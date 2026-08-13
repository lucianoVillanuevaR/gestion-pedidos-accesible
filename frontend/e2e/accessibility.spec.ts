import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function openAccessibilityPanel(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: /accesibilidad|opciones de ayuda/i })
    .first()
    .click();
  await expect(page.getByRole("dialog", { name: /panel de opciones simples/i })).toBeVisible();
}

test("la entrada y el panel no tienen violaciones WCAG A/AA detectables", async ({ page }) => {
  await openAccessibilityPanel(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("el panel encierra y restaura el foco usando solo teclado", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /accesibilidad|opciones de ayuda/i }).first();
  await trigger.focus();
  await trigger.press("Enter");
  const closeButton = page.getByRole("button", { name: "Cerrar panel de opciones" });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("permite ampliar texto sin desbordamiento horizontal móvil", async ({ page }) => {
  await openAccessibilityPanel(page);
  await page.getByRole("button", { name: "Tamaño de texto Grande" }).click();
  await page.getByRole("button", { name: "Activar modo fácil" }).click();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});
