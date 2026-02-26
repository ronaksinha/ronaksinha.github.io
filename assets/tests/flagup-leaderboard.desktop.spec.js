const path = require("path");
const { pathToFileURL } = require("url");
const { test, expect } = require("@playwright/test");

test.use({ browserName: "webkit" });

function getLeaderboardFileUrl() {
    const filePath = path.resolve(__dirname, "../../pages/flagup-leaderboard.html");
    return pathToFileURL(filePath).toString();
}

async function installSupabaseMock(page, options = {}) {
    const initialRows = Array.isArray(options.initialRows) ? options.initialRows : [];
    const failSelect = options.failSelect === true;
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
                                    if (${failSelect ? "true" : "false"}) {
                                        return Promise.resolve({ data: null, error: { message: "select failed" } });
                                    }
                                    const filtered = (window.__leaderboardRows || [])
                                        .filter(function (row) { return !state.mode || row.mode === state.mode; })
                                        .slice(0, n);
                                    return Promise.resolve({ data: filtered, error: null });
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

async function openLeaderboard(page) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(getLeaderboardFileUrl());
    await expect(page.locator("h1")).toContainText("FlagUp Leaderboard");
}

test("leaderboard page supports mode switching", async ({ page }) => {
    await installSupabaseMock(page, {
        initialRows: [
            { username: "EasyOne", score: 10, mode: "easy", created_at: "2026-01-01T00:00:00.000Z" },
            { username: "HardOne", score: 8, mode: "hard", created_at: "2026-01-02T00:00:00.000Z" }
        ]
    });
    await openLeaderboard(page);

    await expect(page.locator("#lb-mode-easy")).toHaveClass(/active/);
    await expect(page.locator("#leaderboard-list li").first()).toContainText("EasyOne");

    await page.locator("#lb-mode-hard").click();
    await expect(page.locator("#lb-mode-hard")).toHaveClass(/active/);
    await expect(page.locator("#leaderboard-status")).toContainText("Top 10 Players All Time");
    await expect(page.locator("#leaderboard-list li").first()).toContainText("HardOne");
});

test("leaderboard page shows empty state", async ({ page }) => {
    await installSupabaseMock(page, { initialRows: [] });
    await openLeaderboard(page);

    await expect(page.locator("#leaderboard-list li").first()).toContainText("No scores yet.");
});

test("leaderboard page shows error status when fetch fails", async ({ page }) => {
    await installSupabaseMock(page, { failSelect: true });
    await openLeaderboard(page);

    await expect(page.locator("#leaderboard-status")).toContainText("Failed to load leaderboard.");
    await expect(page.locator("#leaderboard-list li").first()).toContainText("No scores yet.");
});
