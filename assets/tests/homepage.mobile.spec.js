const path = require("path");
const { pathToFileURL } = require("url");
const { test, expect, devices } = require("@playwright/test");
test.use({ ...devices["iPhone 14"] });

function getHomeFileUrl() {
    const filePath = path.resolve(__dirname, "../../index.html");
    return pathToFileURL(filePath).toString();
}

const expectedHeroText = "Hi, I'm Ronak A Software Engineer";

test("iphone hero title reads correctly", async ({ page }) => {
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

test("iphone timeline keeps center line and both date columns", async ({ page }) => {
    await page.goto(getHomeFileUrl());
    await page.locator("#section-timeline").scrollIntoViewIfNeeded();
    await expect(page.locator(".timeline-container")).toBeVisible();

    const timelineInfo = await page.evaluate(() => {
        const container = document.querySelector(".timeline-container");
        const line = document.querySelector(".timeline-line");
        return {
            gridTemplateColumns: container ? getComputedStyle(container).gridTemplateColumns : "",
            lineDisplay: line ? getComputedStyle(line).display : "",
            leftCount: document.querySelectorAll(".timeline-date").length,
            rightCount: document.querySelectorAll(".timeline-date--right").length
        };
    });

    expect(timelineInfo.gridTemplateColumns).toContain("2px");
    expect(timelineInfo.lineDisplay).toBe("block");
    expect(timelineInfo.leftCount).toBeGreaterThan(0);
    expect(timelineInfo.rightCount).toBeGreaterThan(0);
});
