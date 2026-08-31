import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAs, type DemoRole } from "./helpers/auth";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoDetectableViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

async function openAccessibilityPanel(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: /accesibilidad|opciones de ayuda/i })
    .first()
    .click();
  await expect(page.getByRole("dialog", { name: /opciones de accesibilidad/i })).toBeVisible();
}

test("la entrada y el panel no tienen violaciones WCAG A/AA detectables", async ({ page }) => {
  await openAccessibilityPanel(page);
  await expectNoDetectableViolations(page);
});

const authenticatedRoutes: Array<{ role: DemoRole; routes: string[] }> = [
  {
    role: "cajero",
    routes: ["/pdv", "/pedidos", "/productos", "/inventario", "/cierre-turno"]
  },
  { role: "cocina", routes: ["/cocina"] },
  { role: "admin", routes: ["/admin", "/admin/usuarios"] }
];

for (const { role, routes } of authenticatedRoutes) {
  test(`las pantallas principales de ${role} no tienen violaciones A/AA detectables`, async ({ page }) => {
    await loginAs(page, role);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("#main-content")).toBeVisible();
      await expectNoDetectableViolations(page);
    }
  });
}

test("el panel encierra y restaura el foco usando solo teclado", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /accesibilidad|opciones de ayuda/i }).first();
  await trigger.focus();
  await trigger.press("Enter");
  const closeButton = page.getByRole("button", {
    name: "Cerrar panel de accesibilidad"
  });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("permite ampliar texto sin desbordamiento horizontal móvil", async ({ page }) => {
  await openAccessibilityPanel(page);
  await page.getByRole("button", { name: "Tamaño Grande" }).click();
  await page.getByRole("switch", { name: "Modo fácil: Desactivado" }).click();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("los controles de sonido reflejan y conservan sus preferencias", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page
    .getByRole("button", { name: /accesibilidad|opciones de ayuda/i })
    .first()
    .click();

  await expect(page.getByRole("button", { name: "Suave" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Normal", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Fuerte" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Probar sonido" })).toHaveCount(0);

  await page.getByRole("switch", { name: "Sonidos: Desactivado" }).click();
  await expect(page.getByRole("switch", { name: "Sonidos: Activado" })).toHaveAttribute("aria-checked", "true");

  const soft = page.getByRole("button", { name: "Suave" });
  const normal = page.getByRole("button", { name: "Normal", exact: true });
  const loud = page.getByRole("button", { name: "Fuerte" });
  const preview = page.getByRole("button", { name: "Probar sonido" });

  await expect(soft).toBeEnabled();
  await expect(normal).toBeEnabled();
  await expect(loud).toBeEnabled();
  await expect(preview).toBeEnabled();
  await expect(soft).toHaveAttribute("aria-pressed", "true");

  await normal.click();
  await expect(normal).toHaveAttribute("aria-pressed", "true");
  await expect(soft).toHaveAttribute("aria-pressed", "false");

  await page.reload();
  await page
    .getByRole("button", { name: /accesibilidad|opciones de ayuda/i })
    .first()
    .click();
  await expect(page.getByRole("switch", { name: "Sonidos: Activado" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Normal", exact: true })).toHaveAttribute("aria-pressed", "true");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Restablecer ajustes" }).click();
  await expect(page.getByRole("switch", { name: "Sonidos: Desactivado" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Suave" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Normal", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Fuerte" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Probar sonido" })).toHaveCount(0);
});
