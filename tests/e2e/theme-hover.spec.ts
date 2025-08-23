import { test, expect } from "@playwright/test";

test.describe("Theme and Hover Effects", () => {
  test("sidebar hover effect in dark theme", async ({ page }) => {
    // Navigate to the home page
    await page.goto("/");

    // Wait for the page to load and theme to be applied
    await page.waitForLoadState("networkidle");

    // First, let's check if the theme toggle is present and switch to dark theme
    const themeToggle = page
      .locator('[data-slot="dropdown-menu-trigger"]')
      .first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();

      // Click on Dark theme option
      const darkOption = page.getByText("Dark");
      if (await darkOption.isVisible()) {
        await darkOption.click();
      }

      // Wait a bit for theme transition
      await page.waitForTimeout(500);
    } else {
      // If no theme toggle, try to set dark theme manually via class
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      });
    }

    // Verify we're in dark theme by checking the background color
    const bodyStyles = await page.evaluate(() => {
      const computed = getComputedStyle(document.body);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
      };
    });

    console.log("Body styles in dark theme:", bodyStyles);

    // Look for sidebar navigation items
    const sidebarItems = page.locator(
      'a[href="/members"], a[href="/"], a[href="/memberships"], a[href="/payments"], a[href="/analytics"]'
    );

    if ((await sidebarItems.count()) > 0) {
      // Test hover on the first available sidebar item
      const firstSidebarItem = sidebarItems.first();
      const button = firstSidebarItem.locator("button");

      // Get initial styles
      const initialStyles = await button.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
        };
      });

      console.log("Initial sidebar button styles:", initialStyles);

      // Hover over the sidebar item
      await firstSidebarItem.hover();

      // Wait for hover transition
      await page.waitForTimeout(200);

      // Get hover styles
      const hoverStyles = await button.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
        };
      });

      console.log("Hover sidebar button styles:", hoverStyles);

      // Check if the background color changed to primary red on hover
      expect(hoverStyles.backgroundColor).not.toBe(
        initialStyles.backgroundColor
      );

      // Take a screenshot to visually inspect the hover effect
      await page.screenshot({
        path: "tests/e2e/screenshots/dark-theme-hover.png",
        fullPage: true,
      });
    } else {
      console.log(
        "No sidebar items found - might be mobile view or different layout"
      );

      // Take a screenshot anyway to see what's on the page
      await page.screenshot({
        path: "tests/e2e/screenshots/dark-theme-no-sidebar.png",
        fullPage: true,
      });
    }
  });

  test("check CSS custom properties in dark theme", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    });

    // Check CSS custom properties
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);

      return {
        sidebarAccent: computed.getPropertyValue("--sidebar-accent").trim(),
        sidebarAccentForeground: computed
          .getPropertyValue("--sidebar-accent-foreground")
          .trim(),
        primary: computed.getPropertyValue("--primary").trim(),
      };
    });

    console.log("CSS Variables in dark theme:", cssVars);

    // Verify that sidebar-accent matches primary
    expect(cssVars.sidebarAccent).toBe(cssVars.primary);
  });
});
