const path = require("path");
const { pathToFileURL } = require("url");
const { test, expect } = require("@playwright/test");
test.use({ browserName: "webkit" });

function getFlagUpFileUrl() {
    const filePath = path.resolve(__dirname, "../../pages/flagup.html");
    return pathToFileURL(filePath).toString();
}

async function installSupabaseMock(page, options = {}) {
    const initialRows = Array.isArray(options.initialRows) ? options.initialRows : [];
    const failSelect = options.failSelect === true;
    const failInsert = options.failInsert === true;
    const selectDelayMs = Number.isFinite(options.selectDelayMs) ? Number(options.selectDelayMs) : 0;

    const stubScript = `
        (function () {
            window.__leaderboardRows = ${JSON.stringify(initialRows)};
            window.supabase = {
                createClient: function () {
                    return {
                        from: function () {
                            const state = { mode: null };
                            return {
                                select: function () { return this; },
                                eq: function (_col, value) { state.mode = value; return this; },
                                order: function () { return this; },
                                limit: function (n) {
                                    const respond = function (payload) {
                                        if (${selectDelayMs} <= 0) {
                                            return Promise.resolve(payload);
                                        }
                                        return new Promise(function (resolve) {
                                            setTimeout(function () { resolve(payload); }, ${selectDelayMs});
                                        });
                                    };
                                    if (${failSelect ? "true" : "false"}) {
                                        return respond({ data: null, error: { message: "select failed" } });
                                    }
                                    const filtered = (window.__leaderboardRows || [])
                                        .filter(function (row) { return !state.mode || row.mode === state.mode; })
                                        .slice(0, n);
                                    return respond({ data: filtered, error: null });
                                },
                                insert: function (row) {
                                    if (${failInsert ? "true" : "false"}) {
                                        return Promise.resolve({ error: { message: "insert failed" } });
                                    }
                                    const entry = {
                                        username: row.username,
                                        score: row.score,
                                        mode: row.mode,
                                        created_at: new Date().toISOString()
                                    };
                                    window.__leaderboardRows.push(entry);
                                    return Promise.resolve({ error: null });
                                }
                            };
                        }
                    };
                }
            };
        })();
    `;

    await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/javascript",
            body: stubScript
        });
    });
}

async function openFlagUp(page, options = {}) {
    const rounds = options.rounds ? `?rounds=${options.rounds}` : "";
    await page.goto(`${getFlagUpFileUrl()}${rounds}`);
    await expect(page.locator(".game-card")).toBeVisible();
}

async function answerCurrentEasyCorrect(page) {
    const currentCountry = await page.locator("#flag-image").getAttribute("alt");
    const expectedCountry = (currentCountry || "").replace(/^Flag of /, "");
    await page.locator("#choices .choice-btn", { hasText: expectedCountry }).first().click();
}

test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
});

test("desktop layout can scroll on shorter laptop heights", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 640 });
    await openFlagUp(page);

    const overflowY = await page.evaluate(() => getComputedStyle(document.body).overflowY);
    expect(overflowY).not.toBe("clip");

    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 1200);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore);
});

test("desktop shows random flag facts in easy and medium, hides in expert", async ({ page }) => {
    await openFlagUp(page);

    const fact = page.locator("#flag-fact");

    await expect(fact).toBeVisible();
    await expect(fact).toContainText("Flag fact:");

    await page.locator("#mode-medium-btn").click();
    await expect(fact).toBeVisible();
    await expect(fact).toContainText("Flag fact:");

    await page.locator("#mode-expert-btn").click();
    await expect(fact).toBeHidden();
});

test("easy mode auto-advances after a correct answer", async ({ page }) => {
    await openFlagUp(page);

    const roundLabel = page.locator("#round-label");
    await expect(roundLabel).toContainText("Round: 1");

    await answerCurrentEasyCorrect(page);

    await expect(roundLabel).toContainText("Round: 2");
});

test("medium double-enter skips to next flag without points and hides hint", async ({ page }) => {
    await openFlagUp(page);

    await page.locator("#mode-medium-btn").click();

    const roundLabel = page.locator("#round-label");
    const scoreLabel = page.locator("#score-label");
    const skipHint = page.locator("#double-enter-hint");
    const input = page.locator("#country-input");

    await expect(skipHint).toBeVisible();
    await expect(roundLabel).toContainText("Round: 1");
    await expect(scoreLabel).toContainText("Score: 0");

    await input.press("Enter");
    await input.press("Enter");

    await expect(roundLabel).toContainText("Round: 2");
    await expect(scoreLabel).toContainText("Score: 0");
    await expect(skipHint).toBeHidden();
});

test("medium hint stays visible after submitting a valid but wrong country", async ({ page }) => {
    await openFlagUp(page);
    await page.locator("#mode-medium-btn").click();

    const feedback = page.locator("#feedback");
    await page.locator("#hint-btn").click();
    await expect(feedback).toContainText("Hint: starts with");

    const currentCountry = ((await page.locator("#flag-image").getAttribute("alt")) || "").replace(/^Flag of /, "");
    const wrongGuess = currentCountry === "Canada" ? "Mexico" : "Canada";

    await page.locator("#country-input").fill(wrongGuess);
    await page.locator("#country-input").press("Enter");

    await expect(feedback).toContainText("Hint: starts with");
    await expect(feedback).toContainText("but this flag is different");
});

test("leaderboard submit succeeds and disables re-submit", async ({ page }) => {
    await installSupabaseMock(page);
    await openFlagUp(page, { rounds: 1 });

    await answerCurrentEasyCorrect(page);

    await expect(page.locator("#gameover-modal")).toBeVisible();
    await expect(page.locator("#leaderboard-submit-wrap")).toBeVisible();

    await page.locator("#leaderboard-name-input").fill("Ronak_1");
    await page.locator("#leaderboard-submit-btn").click();

    await expect(page.locator("#leaderboard-submit-feedback")).toContainText("Score submitted.");
    await expect(page.locator("#leaderboard-submit-btn")).toBeDisabled();
    await expect(page.locator("#leaderboard-list li").first()).toContainText("Ronak_1");
});

test("leaderboard username validation rejects invalid values", async ({ page }) => {
    await installSupabaseMock(page);
    await openFlagUp(page, { rounds: 1 });

    await answerCurrentEasyCorrect(page);
    await expect(page.locator("#gameover-modal")).toBeVisible();

    await page.locator("#leaderboard-name-input").fill("!");
    await page.locator("#leaderboard-submit-btn").click();

    await expect(page.locator("#leaderboard-submit-feedback")).toContainText("Use 2-20 chars");
    await expect(page.locator("#leaderboard-submit-btn")).toBeEnabled();
});

test("enter in leaderboard name input submits score and does not trigger retry", async ({ page }) => {
    await installSupabaseMock(page);
    await openFlagUp(page, { rounds: 1 });

    await answerCurrentEasyCorrect(page);
    await expect(page.locator("#gameover-modal")).toBeVisible();

    await page.locator("#leaderboard-name-input").fill("PlayerOne");
    await page.locator("#leaderboard-name-input").press("Enter");

    await expect(page.locator("#leaderboard-submit-feedback")).toContainText("Score submitted.");
    await expect(page.locator("#gameover-modal")).toBeVisible();
});

test("desktop side-rail loader appears while fetching and hides after load", async ({ page }) => {
    await installSupabaseMock(page, {
        selectDelayMs: 500,
        initialRows: [
            { username: "EasyOne", score: 9, mode: "easy", created_at: "2026-01-01T00:00:00.000Z" },
            { username: "HardOne", score: 7, mode: "hard", created_at: "2026-01-02T00:00:00.000Z" }
        ]
    });
    await openFlagUp(page);

    await page.locator("#desktop-lb-left .side-panel-peek").click();
    await expect(page.locator("#desktop-lb-left .side-panel-card")).toBeVisible();

    await page.locator("#desktop-lb-mode-hard").click();

    await expect(page.locator("#desktop-lb-loading")).toBeVisible();
    await expect(page.locator("#desktop-lb-insights-loading")).toBeVisible();
    await expect(page.locator("#desktop-lb-status")).toBeHidden();
    await expect(page.locator("#desktop-lb-summary")).toBeHidden();

    await expect(page.locator("#desktop-lb-loading")).toBeHidden();
    await expect(page.locator("#desktop-lb-insights-loading")).toBeHidden();
    await expect(page.locator("#desktop-lb-status")).toContainText("Top 10 Players All Time");
    await expect(page.locator("#desktop-lb-list li").first()).toContainText("HardOne");
});
