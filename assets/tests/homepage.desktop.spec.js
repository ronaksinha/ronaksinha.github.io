const path = require("path");
const { pathToFileURL } = require("url");
const { test, expect } = require("@playwright/test");
test.use({ browserName: "webkit" });

function getHomeFileUrl() {
    const filePath = path.resolve(__dirname, "../../index.html");
    return pathToFileURL(filePath).toString();
}

const expectedHeroText = "Hi, I'm Ronak A Software Engineer";

test("desktop hero title reads correctly", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(getHomeFileUrl());
    await expect(page.locator(".interactive-text-container .hero-word").first()).toBeVisible();

    const heroText = await page.evaluate(() => {
        const words = Array.from(document.querySelectorAll(".interactive-text-container .hero-word"));
        return words
            .map((word) => Array.from(word.querySelectorAll(".interactive-text"))
                .map((letter) => letter.textContent || "")
                .join("")
                .trim())
            .filter(Boolean)
            .join(" ");
    });

    expect(heroText).toBe(expectedHeroText);
});
