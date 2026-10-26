import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.use({ viewport: { width: 1920, height: 1080 } });

async function openAccessibilityPanel(page: Page) {
  await page.getByRole("button", { name: "Accesibilidad" }).click();
  await expect(
    page.getByRole("dialog", { name: "Opciones de accesibilidad" }),
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await loginAs(page, "cajero");
  await page.goto("/pdv");
});

test("las filas compactas cubren selección, hover, foco, pulsación y nombres largos", async ({
  page,
}) => {
  const categories = page.getByRole("navigation", {
    name: "Categorías de productos",
  });
  const longCategory = categories.getByRole("button", {
    name: "Ahorros exclusivos",
  });
  const allProducts = categories.getByRole("button", { name: "Todos" });

  await expect(categories).toBeVisible();
  await expect(longCategory).toBeVisible();

  const longLabelMetrics = await longCategory
    .locator("span")
    .first()
    .evaluate((label) => {
      const styles = getComputedStyle(label);
      return {
        height: label.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(styles.lineHeight),
        whiteSpace: styles.whiteSpace,
      };
    });
  expect(longLabelMetrics.whiteSpace).toBe("normal");
  expect(longLabelMetrics.height).toBeLessThanOrEqual(
    longLabelMetrics.lineHeight * 2.1,
  );
  expect(longLabelMetrics.height).toBeGreaterThan(
    longLabelMetrics.lineHeight * 1.5,
  );

  await allProducts.hover();
  await expect
    .poll(() =>
      allProducts.evaluate(
        (button) => getComputedStyle(button).backgroundColor,
      ),
    )
    .toBe("rgb(17, 24, 39)");
  await expect
    .poll(() =>
      allProducts.evaluate((button) => getComputedStyle(button).color),
    )
    .toBe("rgb(255, 255, 255)");

  await allProducts.focus();
  await expect
    .poll(() =>
      allProducts.evaluate((button) => getComputedStyle(button).outlineStyle),
    )
    .not.toBe("none");

  await allProducts.hover();
  await page.mouse.down();
  await expect
    .poll(() =>
      allProducts.evaluate(
        (button) => getComputedStyle(button).backgroundColor,
      ),
    )
    .toBe("rgb(0, 0, 0)");
  await page.mouse.up();

  await longCategory.click();
  await expect(longCategory).toHaveAttribute("aria-pressed", "true");
  await expect(longCategory).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "Ahorros exclusivos" }),
  ).toBeVisible();
  await page.mouse.move(1000, 800);
  await expect
    .poll(() =>
      longCategory.evaluate(
        (button) => getComputedStyle(button).backgroundColor,
      ),
    )
    .toBe("rgb(254, 206, 0)");
});

test("alto contraste conserva estados distinguibles", async ({ page }) => {
  await openAccessibilityPanel(page);
  await page
    .getByRole("switch", { name: "Contraste alto: Desactivado" })
    .click();
  await page
    .getByRole("button", { name: "Cerrar panel de accesibilidad" })
    .click();

  const categories = page.getByRole("navigation", {
    name: "Categorías de productos",
  });
  const selectedCategory = categories.locator('button[aria-pressed="true"]');
  const allProducts = categories.getByRole("button", { name: "Todos" });

  await expect(selectedCategory).toHaveCSS(
    "background-color",
    "rgb(250, 204, 21)",
  );
  await allProducts.hover();
  await expect(allProducts).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(allProducts).toHaveCSS("color", "rgb(0, 0, 0)");

  await page.mouse.down();
  await expect(allProducts).toHaveCSS("background-color", "rgb(250, 204, 21)");
  await page.mouse.up();
});

test("modo fácil usa la misma selección amarilla y conserva botones táctiles", async ({
  page,
}) => {
  await page.goto("/pdv/facil");

  const openTurnButton = page.getByRole("button", { name: "Abrir turno" });
  if (await openTurnButton.isVisible()) {
    test.skip(
      true,
      "La verificación visual de categorías requiere un turno de prueba abierto",
    );
  }

  const selectedCategory = page
    .locator('button.pdv-category-option[aria-pressed="true"]')
    .first();
  const unselectedCategory = page
    .locator('button.pdv-category-option[aria-pressed="false"]')
    .first();

  await expect(selectedCategory).toBeVisible();
  await expect(selectedCategory).toHaveCSS(
    "background-color",
    "rgb(254, 206, 0)",
  );
  await expect(selectedCategory).toHaveCSS("touch-action", "manipulation");

  await unselectedCategory.hover();
  await expect(unselectedCategory).toHaveCSS(
    "background-color",
    "rgb(17, 24, 39)",
  );
  await expect(unselectedCategory).toHaveCSS("color", "rgb(255, 255, 255)");
});
