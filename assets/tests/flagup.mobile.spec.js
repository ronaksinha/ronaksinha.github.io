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

    expect(pageMetrics.scrollHeight).toBeGreaterThan(pageMetrics.clientHeight);
    expect(pageMetrics.scrollHeight).toBeLessThanOrEqual(pageMetrics.clientHeight + 140);

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

test("hard failure end-screen shows missed flag thumbnail and answer text on iphone", async ({ page }) => {
    await page.locator("#mode-toggle-btn").click();
    await page.locator("#mode-hard-btn").click();
    await page.locator("#giveup-btn").click();

    const missedWrap = page.locator("#gameover-missed-wrap");
    const missedItem = page.locator("#gameover-missed-list li").first();
    const missedThumb = missedItem.locator("img.missed-flag-thumb");
    const missedText = missedItem.locator(".missed-flag-text");

    await expect(missedWrap).toBeVisible();
    await expect(missedItem).toBeVisible();
    await expect(missedThumb).toBeVisible();
    await expect(missedThumb).toHaveAttribute("src", /flagcdn\.com\/w80\//);
    await expect(missedText).toContainText("Correct:");
    await expect(missedText).toContainText("Your answers: Gave up");
});

test("typing modes place input above flag and action buttons below flag on iphone", async ({ page }) => {
    await page.locator("#mode-toggle-btn").click();
    await page.locator("#mode-hard-btn").click();

    const input = page.locator("#country-input");
    const flag = page.locator("#flag-image");
    const flagPanel = page.locator(".flag-panel");
    const actions = page.locator(".action-row");

    await expect(input).toBeVisible();
    await expect(flag).toBeVisible();
    await expect(flagPanel).toBeVisible();
    await expect(actions).toBeVisible();

    const inputBox = await input.boundingBox();
    const flagBox = await flag.boundingBox();
    const flagPanelBox = await flagPanel.boundingBox();
    const actionBox = await actions.boundingBox();

    expect(inputBox).not.toBeNull();
    expect(flagBox).not.toBeNull();
    expect(flagPanelBox).not.toBeNull();
    expect(actionBox).not.toBeNull();

    expect(inputBox.y).toBeLessThan(flagBox.y);
    expect(actionBox.y).toBeGreaterThan(flagPanelBox.y + flagPanelBox.height - 1);
});
