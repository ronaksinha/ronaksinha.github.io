const LOCAL_COUNTRY_DATA_URL = "../assets/data/countries-195.json";
const LOCAL_COUNTRY_FACTS_URL = "../assets/data/country-facts.json";
const DESIRED_COUNTRY_COUNT = 195;
const MEDIUM_HINT_COUNT = 6;
const NEXT_QUESTION_TRANSITION_MS = 360;
const EASY_MODE_ADVANCE_DELAY_MS = 500;
const DOUBLE_ENTER_SKIP_WINDOW_MS = 450;
const DESKTOP_HISTOGRAM_MIN_BINS = 10;
const DESKTOP_HISTOGRAM_MAX_BINS = 24;
const DESKTOP_HISTOGRAM_ROW_TARGET_PX = 13;
const DESKTOP_HISTOGRAM_USAGE_RATIO = 0.55;
const DESKTOP_HISTOGRAM_BOTTOM_BUFFER_RATIO = 0.15;
const LEADERBOARD_TABLE = "leaderboard_scores";
const LEADERBOARD_MAX_ROWS = 10;
const LEADERBOARD_FETCH_LIMIT = 200;
const SUPABASE_URL = "https://cgqazsregqlcgnkehbwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BD9Qn5CNFN7VgjgDdmCJTw_Bv6INgQ0";
const Core = window.FlagUpCore;
const FALLBACK_FLAG_FACT_TEMPLATE = "The flag of {country} is a national symbol of the country.";
const COUNTRY_ALIASES = {
    "United States": ["usa", "us", "u.s.", "u.s.a."],
    "United Kingdom": ["uk", "gbr", "great britain", "britain"],
    "United Arab Emirates": ["uae"],
    "Czechia": ["czech republic"],
    "Eswatini": ["swaziland"],
    "Myanmar": ["burma"],
    "Cote d'Ivoire": ["ivory coast"],
    "Democratic Republic of the Congo": ["drc", "congo kinshasa", "democratic republic of congo", "dr congo"],
    "Republic of the Congo": ["congo brazzaville", "republic of congo"],
    "South Korea": ["rok", "republic of korea"],
    "North Korea": ["dprk"],
    "Cape Verde": ["cabo verde"],
    "Viet Nam": ["vietnam"],
    "São Tomé and Príncipe": ["sao tome and principe", "stp"],
    "SÃ£o TomÃ© and PrÃ­ncipe": ["sao tome and principe", "stp"]
};

const fallbackFlagData = [
    { country: "Argentina", code: "ar" },
    { country: "Australia", code: "au" },
    { country: "Brazil", code: "br" },
    { country: "Canada", code: "ca" },
    { country: "China", code: "cn" },
    { country: "France", code: "fr" },
    { country: "Germany", code: "de" },
    { country: "India", code: "in" },
    { country: "Italy", code: "it" },
    { country: "Japan", code: "jp" },
    { country: "Mexico", code: "mx" },
    { country: "Netherlands", code: "nl" },
    { country: "Norway", code: "no" },
    { country: "Portugal", code: "pt" },
    { country: "South Korea", code: "kr" },
    { country: "Spain", code: "es" },
    { country: "Sweden", code: "se" },
    { country: "Switzerland", code: "ch" },
    { country: "United Kingdom", code: "gb" },
    { country: "United States", code: "us" }
];

const flagImage = document.getElementById("flag-image");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const scoreLabel = document.getElementById("score-label");
const roundLabel = document.getElementById("round-label");
const hintLabel = document.getElementById("hint-label");
const flagFactEl = document.getElementById("flag-fact");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const modeEasyBtn = document.getElementById("mode-easy-btn");
const modeMediumBtn = document.getElementById("mode-medium-btn");
const modeHardBtn = document.getElementById("mode-hard-btn");
const modeExpertBtn = document.getElementById("mode-expert-btn");
const modeToggleBtn = document.getElementById("mode-toggle-btn");
const modeRow = document.getElementById("mode-row");
const cardMain = document.querySelector(".card-main");
const flagPanel = document.querySelector(".flag-panel");
const answerPanel = document.querySelector(".answer-panel");
const mobileTypingTop = document.getElementById("mobile-typing-top");
const mobileTypingBottom = document.getElementById("mobile-typing-bottom");
const typingStack = document.getElementById("typing-stack");
const typingStackAnchor = document.getElementById("typing-stack-anchor");
const actionRow = document.querySelector(".action-row");
const actionRowAnchor = document.getElementById("action-row-anchor");
const hardAnswerEl = document.getElementById("hard-answer");
const countryInput = document.getElementById("country-input");
const hintRow = document.getElementById("hint-row");
const hintBtn = document.getElementById("hint-btn");
const doubleEnterHintEl = document.getElementById("double-enter-hint");
const giveUpBtn = document.getElementById("giveup-btn");
const gameOverModal = document.getElementById("gameover-modal");
const gameOverTitle = document.getElementById("gameover-title");
const gameOverMessage = document.getElementById("gameover-message");
const gameOverScore = document.getElementById("gameover-score");
const gameOverBest = document.getElementById("gameover-best");
const gameOverMissedWrap = document.getElementById("gameover-missed-wrap");
const gameOverMissedList = document.getElementById("gameover-missed-list");
const leaderboardSubmitWrap = document.getElementById("leaderboard-submit-wrap");
const leaderboardNameInput = document.getElementById("leaderboard-name-input");
const leaderboardSubmitBtn = document.getElementById("leaderboard-submit-btn");
const leaderboardSubmitFeedback = document.getElementById("leaderboard-submit-feedback");
const leaderboardWrap = document.getElementById("leaderboard-wrap");
const leaderboardTitle = document.getElementById("leaderboard-title");
const leaderboardList = document.getElementById("leaderboard-list");
const desktopLbPeekButtons = document.querySelectorAll(".side-panel-peek");
const arenaLayout = document.getElementById("arena-layout");
const desktopLbLeft = document.getElementById("desktop-lb-left");
const desktopLbRight = document.getElementById("desktop-lb-right");
const desktopLbStatus = document.getElementById("desktop-lb-status");
const desktopLbList = document.getElementById("desktop-lb-list");
const desktopLbLoading = document.getElementById("desktop-lb-loading");
const desktopLbInsightsLoading = document.getElementById("desktop-lb-insights-loading");
const desktopLbSummary = document.getElementById("desktop-lb-summary");
const desktopLbTopPlayer = document.getElementById("desktop-lb-top-player");
const desktopLbChartHook = document.getElementById("desktop-lb-chart-hook");
const desktopLbModeButtons = {
    easy: document.getElementById("desktop-lb-mode-easy"),
    medium: document.getElementById("desktop-lb-mode-medium"),
    hard: document.getElementById("desktop-lb-mode-hard"),
    expert: document.getElementById("desktop-lb-mode-expert")
};
const retryBtn = document.getElementById("retry-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const phoneDifficultyMenuQuery = window.matchMedia("(max-width: 430px)");
const desktopLeaderboardQuery = window.matchMedia("(min-width: 1200px)");
const pageParams = new URLSearchParams(window.location.search);
const debugRoundLimitRaw = Number(pageParams.get("rounds"));
const debugRoundLimit = Number.isInteger(debugRoundLimitRaw) && debugRoundLimitRaw > 0
    ? debugRoundLimitRaw
    : null;

let countryPool = [];
let questionQueue = [];
let score = 0;
let round = 0;
let totalRounds = 0;
let currentQuestion = null;
let answered = false;
let currentMode = "easy";
let normalizedCountryLookup = new Map();
let hintsRemaining = MEDIUM_HINT_COUNT;
let hintedThisQuestion = false;
let gameOver = false;
let gameOverOpenedAt = 0;
let gameOverRetryMode = "expert";
let missedFlags = [];
let currentQuestionKey = "";
let countryFactsByCode = new Map();
let lastEnterPressedAt = 0;
let doubleEnterHintDismissed = false;
let leaderboardSubmittedThisRun = false;
let leaderboardSubmitting = false;
let desktopLeaderboardMode = "easy";
let desktopLeaderboardExpanded = false;
let desktopLeaderboardLastRows = [];
let desktopHistogramResizeTimer = 0;
let mobileScrollSnapTimer = 0;

const supabaseClient = (window.supabase && typeof window.supabase.createClient === "function" && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

const EXPERT_BEST_SCORE_KEY = "flagup_expert_best_score";

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function isTypingMode() {
    return currentMode === "medium" || currentMode === "hard" || currentMode === "expert";
}

function shouldKeepTypingFocus() {
    return isTypingMode() && !gameOver && !countryInput.disabled;
}

function toModeLabel(mode) {
    if (!mode) {
        return "";
    }
    return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function isPhoneDifficultyMenu() {
    return phoneDifficultyMenuQuery.matches;
}

function isDesktopFactMode() {
    return !isPhoneDifficultyMenu() && (currentMode === "easy" || currentMode === "medium");
}

function updateModeToggleLabel() {
    if (!modeToggleBtn) {
        return;
    }
    const expanded = modeToggleBtn.getAttribute("aria-expanded") === "true";
    const suffix = isPhoneDifficultyMenu() ? (expanded ? " ▲" : " ▼") : "";
    modeToggleBtn.textContent = `Difficulty: ${toModeLabel(currentMode)}${suffix}`;
}

function syncPhoneDifficultyScrollState() {
    const body = document.body;
    if (!body || !modeToggleBtn || !modeRow) {
        return;
    }

    const expanded = modeToggleBtn.getAttribute("aria-expanded") === "true";
    const shouldEnableScroll = isPhoneDifficultyMenu() && expanded;
    body.classList.toggle("phone-difficulty-open", shouldEnableScroll);
}

function shouldAutoSnapMobileScroll() {
    if (!isPhoneDifficultyMenu()) {
        return false;
    }
    if (document.body && document.body.classList.contains("phone-difficulty-open")) {
        return false;
    }
    if (gameOverModal && !gameOverModal.classList.contains("hidden")) {
        return false;
    }
    return true;
}

function scheduleMobileScrollSnapBack() {
    window.clearTimeout(mobileScrollSnapTimer);
    if (!shouldAutoSnapMobileScroll()) {
        return;
    }

    mobileScrollSnapTimer = window.setTimeout(function () {
        if (!shouldAutoSnapMobileScroll()) {
            return;
        }
        const offset = window.scrollY || window.pageYOffset || 0;
        if (offset <= 2) {
            return;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, 120);
}

function syncDifficultyMenuState() {
    if (!modeToggleBtn || !modeRow) {
        return;
    }
    if (isPhoneDifficultyMenu()) {
        modeToggleBtn.classList.remove("hidden");
        const expanded = modeToggleBtn.getAttribute("aria-expanded") === "true";
        modeRow.classList.toggle("collapsed", !expanded);
    } else {
        modeToggleBtn.classList.add("hidden");
        modeToggleBtn.setAttribute("aria-expanded", "false");
        modeRow.classList.remove("collapsed");
    }
    updateModeToggleLabel();
    syncPhoneDifficultyScrollState();
    if (currentQuestion && isDesktopFactMode()) {
        showFlagFactForQuestion(currentQuestion);
    } else {
        hideFlagFact();
    }
}

function collapseDifficultyMenuOnPhone() {
    if (!modeToggleBtn || !modeRow || !isPhoneDifficultyMenu()) {
        return;
    }
    modeToggleBtn.setAttribute("aria-expanded", "false");
    modeRow.classList.add("collapsed");
    updateModeToggleLabel();
    syncPhoneDifficultyScrollState();
}

function insertAfter(parent, node, anchor) {
    if (!parent || !node || !anchor) {
        return;
    }
    if (anchor.nextSibling) {
        parent.insertBefore(node, anchor.nextSibling);
    } else {
        parent.appendChild(node);
    }
}

function syncMobileTypingLayout() {
    if (!cardMain || !answerPanel || !typingStack || !actionRow || !flagPanel || !mobileTypingTop || !mobileTypingBottom) {
        return;
    }

    const usePhoneTypingLayout = isPhoneDifficultyMenu() && isTypingMode();

    if (usePhoneTypingLayout) {
        mobileTypingTop.classList.remove("hidden");
        mobileTypingBottom.classList.remove("hidden");

        if (typingStack.parentElement !== mobileTypingTop) {
            mobileTypingTop.appendChild(typingStack);
        }
        if (actionRow.parentElement !== mobileTypingBottom) {
            mobileTypingBottom.appendChild(actionRow);
        }
        return;
    }

    mobileTypingTop.classList.add("hidden");
    mobileTypingBottom.classList.add("hidden");

    if (typingStack.parentElement !== answerPanel) {
        insertAfter(answerPanel, typingStack, typingStackAnchor);
    }
    if (actionRow.parentElement !== answerPanel) {
        insertAfter(answerPanel, actionRow, actionRowAnchor);
    }
}

function updateStats() {
    scoreLabel.textContent = `Score: ${score}`;
    roundLabel.textContent = `Round: ${round} / ${totalRounds}`;
    hintLabel.textContent = `Hints: ${hintsRemaining}`;
}

function getExpertBestScore() {
    const raw = window.localStorage.getItem(EXPERT_BEST_SCORE_KEY);
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

function saveExpertBestScore(value) {
    window.localStorage.setItem(EXPERT_BEST_SCORE_KEY, String(value));
}

function canUseLeaderboard() {
    return Boolean(supabaseClient);
}

function normalizeUsernameForSubmit(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 20);
}

function isValidLeaderboardUsername(name) {
    return /^[A-Za-z0-9 _.-]{2,20}$/.test(name);
}

function setLeaderboardSubmitFeedback(text, ok) {
    if (!leaderboardSubmitFeedback) {
        return;
    }
    leaderboardSubmitFeedback.textContent = text;
    leaderboardSubmitFeedback.style.color = ok ? "#86efac" : "#fecaca";
}

function normalizeLeaderboardUsername(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
}

function buildTopLeaderboardRows(rawRows) {
    const bestByUser = new Map();

    (Array.isArray(rawRows) ? rawRows : []).forEach((row) => {
        const username = normalizeLeaderboardUsername(row.username);
        const scoreValue = Number(row.score);
        if (!username || !Number.isFinite(scoreValue)) {
            return;
        }

        const key = username.toLowerCase();
        const createdAt = row.created_at ? new Date(row.created_at) : null;
        const createdMs = createdAt && !Number.isNaN(createdAt.getTime())
            ? createdAt.getTime()
            : Number.MAX_SAFE_INTEGER;
        const next = {
            username,
            score: scoreValue,
            createdMs
        };
        const existing = bestByUser.get(key);

        if (!existing || next.score > existing.score) {
            bestByUser.set(key, next);
            return;
        }
        if (next.score === existing.score && next.createdMs < existing.createdMs) {
            bestByUser.set(key, next);
        }
    });

    const sorted = Array.from(bestByUser.values())
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            if (a.createdMs !== b.createdMs) {
                return a.createdMs - b.createdMs;
            }
            return a.username.localeCompare(b.username, undefined, { sensitivity: "base" });
        })
        .slice(0, LEADERBOARD_MAX_ROWS);

    let rank = 0;
    let previousScore = null;
    return sorted.map((entry, index) => {
        if (entry.score !== previousScore) {
            rank = index + 1;
            previousScore = entry.score;
        }
        return {
            rank,
            username: entry.username,
            score: entry.score
        };
    });
}

function canUseDesktopLeaderboard() {
    return Boolean(arenaLayout && desktopLeaderboardQuery.matches);
}

function setDesktopLeaderboardStatus(text, ok) {
    if (!desktopLbStatus) {
        return;
    }
    desktopLbStatus.textContent = text;
    desktopLbStatus.style.color = ok ? "#86efac" : "#fecaca";
}

function setDesktopRailLoading(loading) {
    const isLoading = Boolean(loading);
    const UiLoader = window.UiLoader;

    if (desktopLbLoading) {
        if (UiLoader) {
            UiLoader.mount(desktopLbLoading, { label: "Loading leaderboard" });
            UiLoader.setVisible(desktopLbLoading, isLoading);
        } else {
            desktopLbLoading.classList.toggle("hidden", !isLoading);
        }
    }
    if (desktopLbInsightsLoading) {
        if (UiLoader) {
            UiLoader.mount(desktopLbInsightsLoading, { label: "Loading insights" });
            UiLoader.setVisible(desktopLbInsightsLoading, isLoading);
        } else {
            desktopLbInsightsLoading.classList.toggle("hidden", !isLoading);
        }
    }
    if (desktopLbStatus) {
        desktopLbStatus.classList.toggle("hidden", isLoading);
    }
    if (desktopLbSummary) {
        desktopLbSummary.classList.toggle("hidden", isLoading);
    }
    if (desktopLbTopPlayer) {
        desktopLbTopPlayer.classList.toggle("hidden", isLoading);
    }
    if (desktopLbChartHook) {
        desktopLbChartHook.classList.toggle("hidden", isLoading);
    }
}

function setDesktopLeaderboardExpanded(expanded) {
    if (!arenaLayout) {
        return;
    }
    const next = Boolean(expanded) && canUseDesktopLeaderboard();
    desktopLeaderboardExpanded = next;
    arenaLayout.classList.toggle("leaderboard-expanded", next);
    Array.from(desktopLbPeekButtons).forEach((button) => {
        button.setAttribute("aria-expanded", String(next));
    });
    if (desktopLbLeft) {
        desktopLbLeft.setAttribute("aria-hidden", String(!next));
    }
    if (desktopLbRight) {
        desktopLbRight.setAttribute("aria-hidden", String(!next));
    }
}

function syncDesktopLeaderboardViewport() {
    if (!arenaLayout) {
        return;
    }
    if (canUseDesktopLeaderboard()) {
        setDesktopLeaderboardExpanded(desktopLeaderboardExpanded);
        return;
    }
    setDesktopLeaderboardExpanded(false);
}

function setDesktopLeaderboardModeButtons(mode) {
    Object.keys(desktopLbModeButtons).forEach((key) => {
        const button = desktopLbModeButtons[key];
        if (!button) {
            return;
        }
        button.classList.toggle("active", key === mode);
    });
}

function renderDesktopLeaderboardRows(rows) {
    if (!desktopLbList) {
        return;
    }
    desktopLbList.innerHTML = "";

    (Array.isArray(rows) ? rows : []).forEach((row, index) => {
        const item = document.createElement("li");
        const rankLabel = Number.isFinite(Number(row.rank)) ? row.rank : (index + 1);
        item.textContent = `#${rankLabel} ${row.username} - ${row.score}`;
        desktopLbList.appendChild(item);
    });

    if (desktopLbList.children.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No scores yet.";
        desktopLbList.appendChild(item);
    }
}

function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getDesktopHistogramBinCount() {
    const fallback = 12;
    if (!desktopLbChartHook) {
        return fallback;
    }

    let chartHeight = desktopLbChartHook.clientHeight;
    const railCard = desktopLbChartHook.closest(".side-panel-card");
    if (railCard) {
        const cardRect = railCard.getBoundingClientRect();
        const chartRect = desktopLbChartHook.getBoundingClientRect();
        const remainingHeight = Math.max(0, cardRect.bottom - chartRect.top);
        const minBottomBuffer = Math.floor(cardRect.height * DESKTOP_HISTOGRAM_BOTTOM_BUFFER_RATIO);
        const maxChartHeight = Math.max(130, remainingHeight - minBottomBuffer);
        const targetChartHeight = Math.floor(remainingHeight * DESKTOP_HISTOGRAM_USAGE_RATIO);
        chartHeight = clampNumber(targetChartHeight, 130, maxChartHeight);
        desktopLbChartHook.style.height = `${chartHeight}px`;
    }

    if (!Number.isFinite(chartHeight) || chartHeight <= 0) {
        return fallback;
    }

    const rawBins = Math.floor((chartHeight - 20) / DESKTOP_HISTOGRAM_ROW_TARGET_PX);
    return clampNumber(rawBins, DESKTOP_HISTOGRAM_MIN_BINS, DESKTOP_HISTOGRAM_MAX_BINS);
}

function renderDesktopLeaderboardBarGraph(mode, rows) {
    if (!desktopLbChartHook) {
        return;
    }

    desktopLbChartHook.innerHTML = "";

    if (!rows || rows.length === 0) {
        const empty = document.createElement("p");
        empty.className = "desktop-lb-chart-empty";
        empty.textContent = `No ${toModeLabel(mode)} score bars yet.`;
        desktopLbChartHook.appendChild(empty);
        desktopLbChartHook.setAttribute("aria-label", `${toModeLabel(mode)} leaderboard chart has no data`);
        return;
    }

    const maxPossibleScore = DESIRED_COUNTRY_COUNT;
    const binCount = getDesktopHistogramBinCount();
    const bins = Array.from({ length: binCount }, function (_, index) {
        const start = Math.floor((index * (maxPossibleScore + 1)) / binCount);
        const end = Math.floor((((index + 1) * (maxPossibleScore + 1)) / binCount) - 1);
        return { start, end, count: 0 };
    });

    rows.forEach((row) => {
        const scoreValue = Math.max(0, Math.min(maxPossibleScore, Number(row.score) || 0));
        const binIndex = Math.min(
            binCount - 1,
            Math.floor((scoreValue / (maxPossibleScore + 1)) * binCount)
        );
        bins[binIndex].count += 1;
    });

    const maxFrequency = Math.max(...bins.map((bin) => bin.count), 1);
    const bars = document.createElement("div");
    bars.className = "desktop-lb-chart-bars";

    const axis = document.createElement("div");
    axis.className = "desktop-lb-chart-x-axis";
    const xTickCount = 4;
    for (let i = 0; i <= xTickCount; i += 1) {
        const tick = document.createElement("span");
        tick.className = "desktop-lb-chart-x-tick";
        tick.textContent = String(Math.round((maxFrequency / xTickCount) * i));
        axis.appendChild(tick);
    }

    const plot = document.createElement("div");
    plot.className = "desktop-lb-chart-plot";
    plot.style.gridTemplateRows = `repeat(${bins.length}, minmax(0, 1fr))`;

    bins.forEach((bin) => {
        const widthRatio = (bin.count / maxFrequency) * 100;

        const column = document.createElement("div");
        column.className = "desktop-lb-chart-column";
        column.title = `${bin.start}-${bin.end}: ${bin.count}`;

        const barWrap = document.createElement("div");
        barWrap.className = "desktop-lb-chart-bar-wrap";

        const bar = document.createElement("span");
        bar.className = "desktop-lb-chart-bar";
        bar.style.width = `${Math.max(widthRatio, bin.count > 0 ? 2 : 0)}%`;

        const label = document.createElement("span");
        label.className = "desktop-lb-chart-x-label";
        label.textContent = `${bin.start}-${bin.end}`;

        const value = document.createElement("span");
        value.className = "desktop-lb-chart-value";
        value.textContent = String(bin.count);

        barWrap.appendChild(bar);
        column.appendChild(value);
        column.appendChild(label);
        column.appendChild(barWrap);
        plot.appendChild(column);
    });

    bars.appendChild(axis);
    bars.appendChild(plot);
    desktopLbChartHook.appendChild(bars);
    desktopLbChartHook.setAttribute("aria-label", `${toModeLabel(mode)} horizontal histogram across score bins 0 to ${maxPossibleScore}`);
}

function updateDesktopLeaderboardInsights(mode, rows) {
    if (!desktopLbSummary || !desktopLbChartHook || !desktopLbTopPlayer) {
        return;
    }

    if (!rows || rows.length === 0) {
        desktopLeaderboardLastRows = [];
        desktopLbSummary.textContent = `No ${toModeLabel(mode)} data yet for average calculations.`;
        desktopLbTopPlayer.textContent = "Top player: -";
        renderDesktopLeaderboardBarGraph(mode, []);
        return;
    }

    desktopLeaderboardLastRows = rows;
    const total = rows.reduce((sum, row) => sum + row.score, 0);
    const average = total / rows.length;
    const best = rows[0];
    desktopLbSummary.textContent = `${toModeLabel(mode)} average: ${average.toFixed(2)} (${rows.length} players)`;
    desktopLbTopPlayer.textContent = `Top player: ${best.username} (${best.score})`;
    renderDesktopLeaderboardBarGraph(mode, rows);
}

async function refreshDesktopLeaderboardForMode(mode) {
    if (!desktopLbList || !desktopLbStatus || !desktopLbSummary) {
        return;
    }

    desktopLeaderboardMode = mode;
    setDesktopLeaderboardModeButtons(mode);
    setDesktopRailLoading(true);

    if (!canUseLeaderboard()) {
        renderDesktopLeaderboardRows([]);
        updateDesktopLeaderboardInsights(mode, []);
        setDesktopLeaderboardStatus("Leaderboard unavailable right now.", false);
        setDesktopRailLoading(false);
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .select("username,score,created_at")
            .eq("mode", mode)
            .order("score", { ascending: false })
            .order("created_at", { ascending: true })
            .limit(LEADERBOARD_FETCH_LIMIT);

        if (error) {
            renderDesktopLeaderboardRows([]);
            updateDesktopLeaderboardInsights(mode, []);
            setDesktopLeaderboardStatus("Failed to load leaderboard.", false);
            setDesktopRailLoading(false);
            return;
        }

        const rows = buildTopLeaderboardRows(data || []);
        renderDesktopLeaderboardRows(rows);
        updateDesktopLeaderboardInsights(mode, rows);
        setDesktopLeaderboardStatus("Top 10 Players All Time", true);
        setDesktopRailLoading(false);
    } catch (error) {
        renderDesktopLeaderboardRows([]);
        updateDesktopLeaderboardInsights(mode, []);
        setDesktopLeaderboardStatus("Failed to load leaderboard.", false);
        setDesktopRailLoading(false);
    }
}

function renderLeaderboardRows(rows) {
    if (!leaderboardList) {
        return;
    }
    leaderboardList.innerHTML = "";
    (Array.isArray(rows) ? rows : []).forEach((row, index) => {
        const item = document.createElement("li");
        const rankLabel = Number.isFinite(Number(row.rank)) ? row.rank : (index + 1);
        item.textContent = `${rankLabel}. ${row.username} - ${row.score}`;
        leaderboardList.appendChild(item);
    });
    if (leaderboardList.children.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No scores yet. Be the first.";
        leaderboardList.appendChild(item);
    }
}

async function refreshLeaderboardForMode(mode) {
    if (!leaderboardWrap || !leaderboardTitle) {
        return;
    }
    leaderboardTitle.textContent = `Top ${LEADERBOARD_MAX_ROWS} (${toModeLabel(mode)})`;
    leaderboardWrap.classList.remove("hidden");

    if (!canUseLeaderboard()) {
        renderLeaderboardRows([]);
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .select("username,score,created_at")
            .eq("mode", mode)
            .order("score", { ascending: false })
            .order("created_at", { ascending: true })
            .limit(LEADERBOARD_FETCH_LIMIT);

        if (error) {
            renderLeaderboardRows([]);
            return;
        }

        renderLeaderboardRows(buildTopLeaderboardRows(data || []));
    } catch (error) {
        renderLeaderboardRows([]);
    }
}

function setupLeaderboardSubmitState() {
    if (!leaderboardSubmitWrap || !leaderboardNameInput || !leaderboardSubmitBtn) {
        return;
    }
    if (!canUseLeaderboard()) {
        leaderboardSubmitWrap.classList.add("hidden");
        return;
    }

    leaderboardSubmitWrap.classList.remove("hidden");
    leaderboardNameInput.disabled = leaderboardSubmittedThisRun;
    leaderboardSubmitBtn.disabled = leaderboardSubmittedThisRun;
    if (!leaderboardSubmittedThisRun) {
        const remembered = window.localStorage.getItem("flagup_leaderboard_name");
        if (remembered && !leaderboardNameInput.value) {
            leaderboardNameInput.value = remembered;
        }
        setLeaderboardSubmitFeedback("Submit your score to the leaderboard.", true);
    } else {
        setLeaderboardSubmitFeedback("Score submitted for this run.", true);
    }
}

async function submitLeaderboardScore() {
    if (!canUseLeaderboard() || leaderboardSubmittedThisRun || leaderboardSubmitting) {
        return;
    }

    const username = normalizeUsernameForSubmit(leaderboardNameInput.value);
    if (!isValidLeaderboardUsername(username)) {
        setLeaderboardSubmitFeedback("Use 2-20 chars: letters, numbers, space, dot, dash, underscore.", false);
        return;
    }

    leaderboardSubmitting = true;
    leaderboardSubmitBtn.disabled = true;
    leaderboardNameInput.disabled = true;
    setLeaderboardSubmitFeedback("Submitting...", true);

    let error = null;
    try {
        const result = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .insert({
                username,
                score,
                mode: gameOverRetryMode || currentMode
            });
        error = result.error;
    } catch (submitError) {
        error = submitError;
    }

    leaderboardSubmitting = false;
    if (error) {
        leaderboardSubmitBtn.disabled = false;
        leaderboardNameInput.disabled = false;
        setLeaderboardSubmitFeedback("Failed to submit score. Try again.", false);
        return;
    }

    leaderboardSubmittedThisRun = true;
    window.localStorage.setItem("flagup_leaderboard_name", username);
    setLeaderboardSubmitFeedback("Score submitted.", true);
    await refreshLeaderboardForMode(gameOverRetryMode || currentMode);
    await refreshDesktopLeaderboardForMode(gameOverRetryMode || currentMode);
}

function setInteractionEnabled(enabled) {
    nextBtn.disabled = !enabled;
    countryInput.disabled = !enabled;
    hintBtn.disabled = !enabled || currentMode !== "medium" || hintedThisQuestion || hintsRemaining <= 0;
    giveUpBtn.disabled = !enabled || (currentMode !== "medium" && currentMode !== "hard");
}

function playNextQuestionTransition() {
    if (!cardMain) {
        return;
    }
    cardMain.classList.remove("question-transition");
    // Force reflow so repeated transitions always restart cleanly.
    void cardMain.offsetWidth;
    cardMain.classList.add("question-transition");
    window.setTimeout(function () {
        cardMain.classList.remove("question-transition");
    }, NEXT_QUESTION_TRANSITION_MS);
}

function hideFlagFact() {
    if (!flagFactEl) {
        return;
    }
    flagFactEl.textContent = "";
    flagFactEl.classList.add("hidden");
}

function updateDoubleEnterHint() {
    if (!doubleEnterHintEl) {
        return;
    }
    const shouldShow = (currentMode === "medium" || currentMode === "hard") && !doubleEnterHintDismissed;
    doubleEnterHintEl.classList.toggle("hidden", !shouldShow);
}

function getQuestionFacts(question) {
    if (!question) {
        return [];
    }
    const code = String(question.code || "").toLowerCase();
    const facts = countryFactsByCode.get(code);
    if (facts && facts.length > 0) {
        return facts;
    }
    return [FALLBACK_FLAG_FACT_TEMPLATE.replace("{country}", question.country)];
}

function escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function anonymizeFactText(factText, countryName) {
    const raw = String(factText || "").trim();
    const country = String(countryName || "").trim();

    if (!country) {
        return raw;
    }

    const possessivePattern = new RegExp(`${escapeRegex(country)}'s`, "gi");
    const countryPattern = new RegExp(escapeRegex(country), "gi");

    return raw
        .replace(possessivePattern, "this country's")
        .replace(countryPattern, "this country");
}

function showFlagFactForQuestion(question) {
    if (!flagFactEl || !question || !isDesktopFactMode()) {
        hideFlagFact();
        return;
    }

    const facts = getQuestionFacts(question);
    const fact = anonymizeFactText(
        facts[Math.floor(Math.random() * facts.length)],
        question.country
    );
    flagFactEl.textContent = `Flag fact: ${fact}`;
    flagFactEl.classList.remove("hidden");
}

function noteMissedFlag(attemptValue) {
    if (!currentQuestion || !currentQuestionKey) {
        return;
    }

    const attemptedAnswer = String(attemptValue || "").trim() || "(blank)";
    const existing = missedFlags.find((entry) => entry.key === currentQuestionKey);

    if (existing) {
        existing.attempts.push(attemptedAnswer);
        return;
    }

    missedFlags.push({
        key: currentQuestionKey,
        flag: currentQuestion.country,
        code: currentQuestion.code,
        correctAnswer: currentQuestion.country,
        attempts: [attemptedAnswer]
    });
}

function renderMissedFlags() {
    gameOverMissedList.innerHTML = "";
    gameOverMissedWrap.classList.remove("hidden");

    if (missedFlags.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No missed flags this run.";
        gameOverMissedList.appendChild(item);
        return;
    }

    missedFlags.forEach((entry) => {
        const item = document.createElement("li");
        const thumb = document.createElement("img");
        thumb.className = "missed-flag-thumb";
        thumb.src = `https://flagcdn.com/w80/${entry.code}.png`;
        thumb.alt = `Flag of ${entry.flag}`;
        thumb.loading = "lazy";

        const text = document.createElement("div");
        text.className = "missed-flag-text";
        const attempted = entry.attempts.join(", ");
        text.textContent = `Correct: ${entry.correctAnswer} | Your answers: ${attempted}`;

        item.appendChild(thumb);
        item.appendChild(text);
        gameOverMissedList.appendChild(item);
    });
}

function showEndScreen(options) {
    const {
        title,
        message,
        retryMode,
        includeBestScore
    } = options;

    gameOver = true;
    answered = true;
    setInteractionEnabled(false);

    const current = score;
    gameOverTitle.textContent = title;
    gameOverMessage.textContent = message;
    gameOverScore.textContent = `Score: ${current} / ${totalRounds}`;

    if (includeBestScore) {
        const previousBest = getExpertBestScore();
        const best = Math.max(current, previousBest);
        if (best !== previousBest) {
            saveExpertBestScore(best);
        }
        gameOverBest.textContent = `All-time best: ${best}`;
        gameOverBest.classList.remove("hidden");
    } else {
        gameOverBest.classList.add("hidden");
    }

    renderMissedFlags();
    setupLeaderboardSubmitState();
    void refreshLeaderboardForMode(retryMode || currentMode);
    gameOverOpenedAt = Date.now();
    gameOverRetryMode = retryMode || currentMode;
    gameOverModal.classList.remove("hidden");
}

function hideGameOverModal() {
    gameOverModal.classList.add("hidden");
}

function retryRun() {
    currentMode = gameOverRetryMode || currentMode;
    hintsRemaining = MEDIUM_HINT_COUNT;
    updateModeUI();
    restartGame();
}

function setFeedback(text, ok) {
    feedbackEl.textContent = text;
    feedbackEl.style.color = ok ? "#86efac" : "#fecaca";
}

function buildMediumHintText(countryName) {
    const hint = Core.buildMediumHint(countryName);
    const wordCount = String(countryName || "").trim().split(/\s+/).filter(Boolean).length;
    const wordCountText = wordCount > 1 ? ` It has ${wordCount} words.` : "";
    return `Hint: starts with "${hint.first}" and ends with "${hint.last}".${wordCountText}`;
}

function getActiveMediumHintText() {
    if (currentMode !== "medium" || !hintedThisQuestion || !currentQuestion || answered) {
        return "";
    }
    return buildMediumHintText(currentQuestion.country);
}

function setTypingFeedback(text, ok) {
    const hintText = getActiveMediumHintText();
    if (hintText && !String(text || "").startsWith("Hint:")) {
        feedbackEl.textContent = "";
        feedbackEl.style.color = ok ? "#86efac" : "#fecaca";

        const hintLine = document.createElement("span");
        hintLine.className = "feedback-hint-line";
        hintLine.textContent = hintText;

        const responseLine = document.createElement("span");
        responseLine.className = "feedback-response-line";
        responseLine.textContent = text;

        feedbackEl.appendChild(hintLine);
        feedbackEl.appendChild(responseLine);
        return;
    }
    setFeedback(text, ok);
}

function normalizeAnswer(value) {
    return Core.normalizeAnswer(value);
}

function normalizeCountryData(rawList) {
    return Core.normalizeCountryData(rawList, DESIRED_COUNTRY_COUNT);
}

function repairCountryLabel(value) {
    const text = String(value || "");
    if (!/[ÃÂ]/.test(text)) {
        return text;
    }
    try {
        const bytes = new Uint8Array(Array.from(text).map((ch) => ch.charCodeAt(0) & 0xff));
        return new TextDecoder("utf-8").decode(bytes);
    } catch (error) {
        return text;
    }
}

function rebuildCountryLookup() {
    normalizedCountryLookup = Core.buildCountryLookup(countryPool);
    const canonicalByNormalized = new Map();

    countryPool.forEach((entry) => {
        canonicalByNormalized.set(normalizeAnswer(entry.country), entry.country);
    });

    Object.keys(COUNTRY_ALIASES).forEach((canonicalName) => {
        const actualCanonical = canonicalByNormalized.get(normalizeAnswer(canonicalName));
        if (!actualCanonical) {
            return;
        }

        COUNTRY_ALIASES[canonicalName].forEach((alias) => {
            normalizedCountryLookup.set(normalizeAnswer(alias), actualCanonical);
        });
    });
}

async function loadCountryPool() {
    try {
        const response = await fetch(LOCAL_COUNTRY_DATA_URL);
        if (!response.ok) {
            throw new Error(`Local country file failed with ${response.status}`);
        }

        const localData = await response.json();
        const normalized = (Array.isArray(localData) ? localData : [])
            .filter((entry) => entry && entry.country && entry.code && String(entry.code).length === 2)
            .map((entry) => ({
                country: repairCountryLabel(entry.country).trim(),
                code: String(entry.code).toLowerCase().trim()
            }))
            .sort((a, b) => a.country.localeCompare(b.country))
            .slice(0, DESIRED_COUNTRY_COUNT);

        if (normalized.length >= DESIRED_COUNTRY_COUNT) {
            countryPool = normalized;
            return;
        }
    } catch (error) {
        console.error("Falling back to in-script flag list.", error);
    }

    countryPool = fallbackFlagData;
}

async function loadCountryFacts() {
    try {
        const response = await fetch(LOCAL_COUNTRY_FACTS_URL);
        if (!response.ok) {
            throw new Error(`Local facts file failed with ${response.status}`);
        }

        const rawFacts = await response.json();
        const factMap = new Map();

        (Array.isArray(rawFacts) ? rawFacts : []).forEach((entry) => {
            if (!entry || !entry.code || !Array.isArray(entry.facts)) {
                return;
            }
            const code = String(entry.code).toLowerCase().trim();
            const facts = entry.facts
                .map((fact) => String(fact || "").trim())
                .filter(Boolean);

            if (!code || facts.length === 0) {
                return;
            }
            factMap.set(code, facts);
        });

        countryFactsByCode = factMap;
    } catch (error) {
        console.error("Falling back to in-script fact template.", error);
        countryFactsByCode = new Map();
    }
}

function buildOptions(correctCountry) {
    const distractors = shuffle(
        countryPool
            .map((entry) => entry.country)
            .filter((name) => name !== correctCountry)
    ).slice(0, 3);

    return shuffle([correctCountry, ...distractors]);
}

function renderChoices(options) {
    choicesEl.innerHTML = "";
    options.forEach((countryName) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-btn";
        button.textContent = countryName;
        button.dataset.country = countryName;
        button.addEventListener("click", function () {
            handleChoice(button, countryName);
        });
        choicesEl.appendChild(button);
    });
}

function updateModeUI() {
    modeEasyBtn.classList.toggle("active", currentMode === "easy");
    modeMediumBtn.classList.toggle("active", currentMode === "medium");
    modeHardBtn.classList.toggle("active", currentMode === "hard");
    modeExpertBtn.classList.toggle("active", currentMode === "expert");

    choicesEl.classList.toggle("hidden", currentMode !== "easy");
    hardAnswerEl.classList.toggle("hidden", !isTypingMode());
    hintRow.classList.toggle("hidden", currentMode !== "medium");
    hintLabel.classList.toggle("hidden", currentMode !== "medium");
    giveUpBtn.classList.toggle("hidden", currentMode !== "medium" && currentMode !== "hard");
    nextBtn.classList.toggle("hidden", currentMode === "expert");
    if (currentMode === "expert") {
        nextBtn.disabled = true;
    }
    updateDoubleEnterHint();
    if (!isDesktopFactMode()) {
        hideFlagFact();
    }
    syncMobileTypingLayout();
    updateModeToggleLabel();
}

function disableChoices() {
    Array.from(choicesEl.children).forEach((button) => {
        button.disabled = true;
    });
}

function handleChoice(button, selectedCountry) {
    if (gameOver || answered || !currentQuestion) {
        return;
    }

    answered = true;
    const isCorrect = selectedCountry === currentQuestion.country;

    if (isCorrect) {
        score += 1;
        button.classList.add("correct");
        setFeedback(`Correct. That is ${currentQuestion.country}.`, true);
        if (currentMode === "easy") {
            nextBtn.disabled = true;
            window.setTimeout(function () {
                nextQuestion();
            }, EASY_MODE_ADVANCE_DELAY_MS);
        }
    } else {
        noteMissedFlag(selectedCountry);
        button.classList.add("incorrect");
        setFeedback(`Not quite. The correct answer is ${currentQuestion.country}.`, false);
    }

    Array.from(choicesEl.children).forEach((choiceButton) => {
        choiceButton.disabled = true;
        if (choiceButton.dataset.country === currentQuestion.country) {
            choiceButton.classList.add("correct");
        }
    });

    updateStats();
}

function handleTypedSubmit() {
    if (gameOver || answered || !currentQuestion || !isTypingMode()) {
        return;
    }

    const typed = countryInput.value;
    if (!typed.trim()) {
        setTypingFeedback("Enter a country name first.", false);
        return;
    }

    const result = Core.evaluateTypedGuess(
        currentMode,
        typed,
        currentQuestion.country,
        normalizedCountryLookup
    );

    if (result.status === "correct") {
        answered = true;
        score += 1;
        setFeedback(`Correct. That is ${currentQuestion.country}.`, true);
        updateStats();
        window.setTimeout(function () {
            nextQuestion();
        }, 120);
        return;
    }

    if (result.status === "expert_fail_country" || result.status === "expert_fail") {
        noteMissedFlag(typed);
        const message = result.status === "expert_fail_country"
            ? `Expert fail. ${result.matchedCountry} is valid, but not this flag.`
            : "Expert fail. Wrong answer.";
        setFeedback(message, false);
        showEndScreen({
            title: "Game Over",
            message: `${message} Correct answer: ${currentQuestion.country}.`,
            retryMode: "expert",
            includeBestScore: true
        });
        return;
    }

    if (result.status === "wrong_other_country") {
        noteMissedFlag(typed);
        setTypingFeedback(`That's ${result.matchedCountry}, but this flag is different. Try again.`, false);
    } else {
        noteMissedFlag(typed);
        setTypingFeedback("Not quite. Try again.", false);
    }
    countryInput.focus();
    countryInput.select();
}

function useMediumHint() {
    if (gameOver || currentMode !== "medium" || !currentQuestion || answered) {
        return;
    }
    if (hintedThisQuestion) {
        setFeedback("You already used a hint for this flag.", false);
        return;
    }
    if (hintsRemaining <= 0) {
        setFeedback("No hints remaining.", false);
        return;
    }

    hintsRemaining -= 1;
    hintedThisQuestion = true;
    hintBtn.disabled = true;
    setFeedback(buildMediumHintText(currentQuestion.country), true);
    updateStats();
}

function handleGiveUp() {
    if (gameOver || answered || !currentQuestion) {
        return;
    }

    answered = true;
    noteMissedFlag("Gave up");
    setFeedback(`Give up used. The correct answer is ${currentQuestion.country}.`, false);
    giveUpBtn.disabled = true;

    if (currentMode === "hard") {
        showEndScreen({
            title: "Game Over",
            message: `Hard mode fail. You gave up. Correct answer: ${currentQuestion.country}.`,
            retryMode: "hard",
            includeBestScore: false
        });
        return;
    }

    if (currentMode === "medium") {
        countryInput.disabled = true;
        hintBtn.disabled = true;
    }

    nextBtn.disabled = false;
    updateStats();
}

function skipQuestionWithDoubleEnter() {
    if (gameOver || answered || !currentQuestion) {
        return;
    }

    answered = true;
    noteMissedFlag("Skipped (double Enter)");
    setFeedback("Skipped. Moving to the next flag (0 points).", false);
    countryInput.value = "";
    updateStats();
    doubleEnterHintDismissed = true;
    updateDoubleEnterHint();
    window.setTimeout(function () {
        nextQuestion();
    }, 120);
}

function finishQuiz() {
    currentQuestion = null;
    answered = true;
    flagImage.removeAttribute("src");
    flagImage.alt = "Flag quiz complete";
    choicesEl.innerHTML = "";
    setFeedback(`Quiz complete. Final score: ${score} / ${totalRounds}.`, true);
    hideFlagFact();
    showEndScreen({
        title: "Quiz Complete",
        message: "Review your missed flags below.",
        retryMode: currentMode,
        includeBestScore: currentMode === "expert"
    });
}

function nextQuestion() {
    if (gameOver) {
        return;
    }
    if (questionQueue.length === 0) {
        finishQuiz();
        return;
    }

    round += 1;
    answered = false;
    hintedThisQuestion = false;
    currentQuestion = questionQueue.pop();
    currentQuestionKey = `${round}-${currentQuestion.code}`;
    lastEnterPressedAt = 0;
    playNextQuestionTransition();

    const options = buildOptions(currentQuestion.country);
    flagImage.src = `https://flagcdn.com/w320/${currentQuestion.code}.png`;
    flagImage.alt = `Flag of ${currentQuestion.country}`;
    showFlagFactForQuestion(currentQuestion);

    if (currentMode === "easy") {
        renderChoices(options);
        giveUpBtn.disabled = true;
    } else {
        choicesEl.innerHTML = "";
        countryInput.value = "";
        countryInput.disabled = false;
        hintBtn.disabled = currentMode !== "medium";
        giveUpBtn.disabled = currentMode !== "medium" && currentMode !== "hard";
        countryInput.focus();
    }

    feedbackEl.textContent = "";
    feedbackEl.style.color = "#c7d3e3";
    nextBtn.disabled = currentMode === "expert";
    updateStats();
}

function restartGame() {
    gameOver = false;
    hideGameOverModal();
    setInteractionEnabled(true);
    restartBtn.disabled = false;
    score = 0;
    round = 0;
    missedFlags = [];
    currentQuestionKey = "";
    lastEnterPressedAt = 0;
    leaderboardSubmittedThisRun = false;
    leaderboardSubmitting = false;
    if (leaderboardSubmitFeedback) {
        leaderboardSubmitFeedback.textContent = "";
    }
    if (leaderboardNameInput) {
        leaderboardNameInput.disabled = false;
    }
    if (leaderboardSubmitBtn) {
        leaderboardSubmitBtn.disabled = false;
    }
    if (currentMode === "medium") {
        hintsRemaining = MEDIUM_HINT_COUNT;
    }
    questionQueue = shuffle(countryPool);
    if (debugRoundLimit !== null) {
        questionQueue = questionQueue.slice(0, Math.min(debugRoundLimit, questionQueue.length));
    }
    totalRounds = questionQueue.length;
    nextQuestion();
}

function switchMode(mode) {
    if (!["easy", "medium", "hard", "expert"].includes(mode)) {
        return;
    }
    if (currentMode === mode) {
        return;
    }
    currentMode = mode;
    hintsRemaining = MEDIUM_HINT_COUNT;
    desktopLeaderboardMode = mode;
    updateModeUI();
    restartGame();
    void refreshDesktopLeaderboardForMode(mode);
    collapseDifficultyMenuOnPhone();
}

async function initGame() {
    setFeedback("Loading country list...", true);
    nextBtn.disabled = true;
    restartBtn.disabled = true;
    disableChoices();

    await loadCountryPool();
    await loadCountryFacts();
    rebuildCountryLookup();

    restartBtn.disabled = false;
    setFeedback(`Loaded ${countryPool.length} countries.`, true);
    updateModeUI();
    restartGame();
    void refreshDesktopLeaderboardForMode(desktopLeaderboardMode);
}

nextBtn.addEventListener("click", nextQuestion);
restartBtn.addEventListener("click", restartGame);
modeEasyBtn.addEventListener("click", function () {
    switchMode("easy");
});
modeMediumBtn.addEventListener("click", function () {
    switchMode("medium");
});
modeHardBtn.addEventListener("click", function () {
    switchMode("hard");
});
modeExpertBtn.addEventListener("click", function () {
    switchMode("expert");
});
hintBtn.addEventListener("click", useMediumHint);
giveUpBtn.addEventListener("click", handleGiveUp);
retryBtn.addEventListener("click", retryRun);
closeModalBtn.addEventListener("click", function () {
    hideGameOverModal();
    restartGame();
});
if (modeToggleBtn && modeRow) {
    modeToggleBtn.addEventListener("click", function () {
        const expanded = modeToggleBtn.getAttribute("aria-expanded") === "true";
        modeToggleBtn.setAttribute("aria-expanded", String(!expanded));
        modeRow.classList.toggle("collapsed", expanded);
        updateModeToggleLabel();
        syncPhoneDifficultyScrollState();
    });
}
Array.from(desktopLbPeekButtons).forEach((button) => {
    button.addEventListener("click", function () {
        const next = !desktopLeaderboardExpanded;
        setDesktopLeaderboardExpanded(next);
        if (next) {
            void refreshDesktopLeaderboardForMode(desktopLeaderboardMode);
        }
    });
});
Object.keys(desktopLbModeButtons).forEach((mode) => {
    const button = desktopLbModeButtons[mode];
    if (!button) {
        return;
    }
    button.addEventListener("click", function () {
        desktopLeaderboardMode = mode;
        if (currentMode !== mode) {
            switchMode(mode);
            return;
        }
        setDesktopLeaderboardModeButtons(mode);
        void refreshDesktopLeaderboardForMode(mode);
    });
});
if (typeof phoneDifficultyMenuQuery.addEventListener === "function") {
    phoneDifficultyMenuQuery.addEventListener("change", syncDifficultyMenuState);
} else if (typeof phoneDifficultyMenuQuery.addListener === "function") {
    phoneDifficultyMenuQuery.addListener(syncDifficultyMenuState);
}
if (typeof desktopLeaderboardQuery.addEventListener === "function") {
    desktopLeaderboardQuery.addEventListener("change", syncDesktopLeaderboardViewport);
} else if (typeof desktopLeaderboardQuery.addListener === "function") {
    desktopLeaderboardQuery.addListener(syncDesktopLeaderboardViewport);
}
window.addEventListener("resize", function () {
    if (!canUseDesktopLeaderboard()) {
        return;
    }
    window.clearTimeout(desktopHistogramResizeTimer);
    desktopHistogramResizeTimer = window.setTimeout(function () {
        renderDesktopLeaderboardBarGraph(desktopLeaderboardMode, desktopLeaderboardLastRows);
    }, 90);
});
window.addEventListener("scroll", function () {
    scheduleMobileScrollSnapBack();
}, { passive: true });
window.addEventListener("touchend", function () {
    scheduleMobileScrollSnapBack();
}, { passive: true });
if (leaderboardSubmitBtn) {
    leaderboardSubmitBtn.addEventListener("click", submitLeaderboardScore);
}
if (leaderboardNameInput) {
    leaderboardNameInput.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") {
            return;
        }
        event.preventDefault();
        submitLeaderboardScore();
    });
}
countryInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        if ((currentMode === "medium" || currentMode === "hard") && !answered && !gameOver && currentQuestion) {
            const now = Date.now();
            if (now - lastEnterPressedAt <= DOUBLE_ENTER_SKIP_WINDOW_MS) {
                lastEnterPressedAt = 0;
                skipQuestionWithDoubleEnter();
                return;
            }
            lastEnterPressedAt = now;
        } else {
            lastEnterPressedAt = 0;
        }
        handleTypedSubmit();
    }
});
countryInput.addEventListener("input", function () {
    if (!currentQuestion || answered) {
        return;
    }
    if (currentMode !== "hard" && currentMode !== "medium") {
        return;
    }

    const result = Core.evaluateTypedGuess(
        currentMode,
        countryInput.value,
        currentQuestion.country,
        normalizedCountryLookup
    );

    if (result.status === "correct") {
        handleTypedSubmit();
        return;
    }

    if (result.status === "wrong_other_country" && result.matchedCountry) {
        setTypingFeedback(`You're thinking of ${result.matchedCountry}, but this flag is different.`, false);
    } else if (currentMode === "medium" && hintedThisQuestion) {
        // Keep the active hint visible throughout this question.
        return;
    } else if (!feedbackEl.textContent.startsWith("Loaded ")) {
        feedbackEl.textContent = "";
        feedbackEl.style.color = "#c7d3e3";
    }
});
document.addEventListener("mousedown", function (event) {
    if (!shouldKeepTypingFocus()) {
        return;
    }
    if (event.target === countryInput) {
        return;
    }

    window.setTimeout(function () {
        if (shouldKeepTypingFocus()) {
            countryInput.focus();
        }
    }, 0);
});
document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") {
        return;
    }
    if (gameOverModal.classList.contains("hidden")) {
        return;
    }
    if (Date.now() - gameOverOpenedAt < 180) {
        return;
    }
    if (event.target === leaderboardNameInput) {
        return;
    }

    event.preventDefault();
    retryRun();
});

initGame();
syncDifficultyMenuState();
syncMobileTypingLayout();
syncDesktopLeaderboardViewport();
syncPhoneDifficultyScrollState();
