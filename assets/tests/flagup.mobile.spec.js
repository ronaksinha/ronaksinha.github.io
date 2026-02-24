const path = require("path");
const { pathToFileURL } = require("url");
const { test, expect, devices } = require("@playwright/test");

test.use({ ...devices["iPhone 14"] });

function getFlagUpFileUrl() {
    const filePath = path.resolve(__dirname, "../../pages/flagup.html");
    return pathToFileURL(filePath).toString();
}

test.beforeEach(async ({ page }) => {
    await page.goto(getFlagUpFileUrl());
    await expect(page.locator(".game-card")).toBeVisible();
});

test("iphone layout fits viewport and hides non-essential header kicker", async ({ page }) => {
    await expect(page.locator(".topbar-kicker")).toBeHidden();
    await expect(page.locator("#mode-toggle-btn")).toBeVisible();

    const pageMetrics = await page.evaluate(() => {
        const root = document.scrollingElement || document.documentElement;
        return {
            scrollHeight: root.scrollHeight,
            clientHeight: root.clientHeight
        };
    });

    expect(pageMetrics.scrollHeight).toBeLessThanOrEqual(pageMetrics.clientHeight + 2);

    const toggle = page.locator("#mode-toggle-btn");
    const toggleBox = await toggle.boundingBox();
    const viewport = page.viewportSize();

    expect(toggleBox).not.toBeNull();
    expect(viewport).not.toBeNull();

    const toggleCenterX = toggleBox.x + (toggleBox.width / 2);
    const viewportCenterX = viewport.width / 2;
    expect(Math.abs(toggleCenterX - viewportCenterX)).toBeLessThanOrEqual(10);
});

test("expert/hard failure modal is constrained on iphone width", async ({ page }) => {
    await page.locator("#mode-toggle-btn").click();
    await page.locator("#mode-hard-btn").click();
    await page.locator("#giveup-btn").click();

    const modalCard = page.locator(".modal-card");
    await expect(modalCard).toBeVisible();

    const modalBox = await modalCard.boundingBox();
    const viewport = page.viewportSize();

    expect(modalBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(modalBox.width).toBeLessThanOrEqual(viewport.width * 0.94);
});
