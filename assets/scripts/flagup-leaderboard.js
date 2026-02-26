const SUPABASE_URL = "https://cgqazsregqlcgnkehbwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BD9Qn5CNFN7VgjgDdmCJTw_Bv6INgQ0";
const LEADERBOARD_TABLE = "leaderboard_scores";
const MAX_ROWS = 10;
const FETCH_LIMIT = 200;

const modeButtons = {
    easy: document.getElementById("lb-mode-easy"),
    medium: document.getElementById("lb-mode-medium"),
    hard: document.getElementById("lb-mode-hard"),
    expert: document.getElementById("lb-mode-expert")
};
const leaderboardStatus = document.getElementById("leaderboard-status");
const leaderboardList = document.getElementById("leaderboard-list");
const leaderboardHead = document.querySelector(".leaderboard-head");
const leaderboardLoading = document.getElementById("leaderboard-loading");
const chartSection = document.querySelector(".chart-section");
const chartSummary = document.getElementById("chart-summary");
const chartHook = document.getElementById("chart-hook");
const chartTitle = document.getElementById("chart-title");
const mobileHistogramQuery = window.matchMedia("(max-width: 430px)");

let currentMode = "easy";

const supabaseClient = (window.supabase && typeof window.supabase.createClient === "function")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

function toModeLabel(mode) {
    return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function isMobileHistogramMode() {
    return mobileHistogramQuery.matches;
}

function setStatus(text, ok) {
    leaderboardStatus.textContent = text;
    leaderboardStatus.style.color = ok ? "#86efac" : "#fecaca";
}

function setLoading(loading) {
    const isLoading = Boolean(loading);
    const UiLoader = window.UiLoader;
    if (leaderboardLoading) {
        if (UiLoader) {
            UiLoader.mount(leaderboardLoading, { label: "Loading leaderboard" });
            UiLoader.setVisible(leaderboardLoading, isLoading);
        } else {
            leaderboardLoading.classList.toggle("hidden", !isLoading);
        }
    }
    if (leaderboardStatus) {
        leaderboardStatus.classList.toggle("hidden", isLoading);
    }
    if (leaderboardHead) {
        leaderboardHead.classList.toggle("hidden", isLoading);
    }
    if (leaderboardList) {
        leaderboardList.classList.toggle("hidden", isLoading);
    }
    if (chartSection) {
        chartSection.classList.toggle("hidden", isLoading);
    }
}

function setModeButtons(mode) {
    Object.keys(modeButtons).forEach((key) => {
        modeButtons[key].classList.toggle("active", key === mode);
    });
}

function normalizeUsername(name) {
    return String(name || "")
        .trim()
        .replace(/\s+/g, " ");
}

function toDenseRankedRows(rawRows) {
    const bestByUser = new Map();

    (Array.isArray(rawRows) ? rawRows : []).forEach((row) => {
        const username = normalizeUsername(row.username);
        const score = Number(row.score);
        if (!username || !Number.isFinite(score)) {
            return;
        }

        const key = username.toLowerCase();
        const createdAt = row.created_at ? new Date(row.created_at) : null;
        const createdMs = createdAt && !Number.isNaN(createdAt.getTime())
            ? createdAt.getTime()
            : Number.MAX_SAFE_INTEGER;
        const next = { username, score, createdMs };
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
        .slice(0, MAX_ROWS);

    let rank = 0;
    let prevScore = null;
    return sorted.map((entry, index) => {
        if (entry.score !== prevScore) {
            rank = index + 1;
            prevScore = entry.score;
        }
        return {
            rank,
            username: entry.username,
            score: entry.score
        };
    });
}

function renderRows(rows) {
    leaderboardList.innerHTML = "";
    if (!rows || rows.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No scores yet.";
        leaderboardList.appendChild(item);
        return;
    }

    rows.forEach((row) => {
        const item = document.createElement("li");
        if (row.rank === 1) {
            item.classList.add("leaderboard-rank-1");
        }

        const rank = document.createElement("span");
        rank.className = "leaderboard-cell-rank";
        rank.textContent = `#${row.rank}`;

        const player = document.createElement("span");
        player.className = "leaderboard-cell-player";
        player.textContent = row.username;

        const score = document.createElement("span");
        score.className = "leaderboard-cell-score";
        score.textContent = String(row.score);

        item.appendChild(rank);
        item.appendChild(player);
        item.appendChild(score);
        leaderboardList.appendChild(item);

        if (row.rank === 1) {
            applyWaveText(rank, `#${row.rank}`);
            applyWaveText(player, row.username);
        }
    });
}

function applyWaveText(target, text) {
    if (!target) {
        return;
    }
    const content = String(text || "");
    target.innerHTML = "";
    Array.from(content).forEach((ch, index) => {
        const letter = document.createElement("span");
        letter.className = "wave-letter";
        letter.textContent = ch === " " ? "\u00A0" : ch;
        letter.style.animationDelay = `${index * 80}ms`;
        target.appendChild(letter);
    });
}

function renderMobileHistogram(mode, rows) {
    if (!chartHook) {
        return;
    }

    chartHook.innerHTML = "";

    if (!rows || rows.length === 0) {
        const empty = document.createElement("p");
        empty.className = "mobile-hist-empty";
        empty.textContent = `No ${toModeLabel(mode)} histogram data yet.`;
        chartHook.appendChild(empty);
        chartHook.setAttribute("aria-label", `${toModeLabel(mode)} mobile histogram has no data`);
        return;
    }

    const maxPossibleScore = 195;
    const binCount = 16;
    const bins = Array.from({ length: binCount }, function (_, index) {
        const start = Math.floor((index * (maxPossibleScore + 1)) / binCount);
        const end = Math.floor((((index + 1) * (maxPossibleScore + 1)) / binCount) - 1);
        return { start, end, count: 0 };
    });

    rows.forEach((row) => {
        const score = Math.max(0, Math.min(maxPossibleScore, Number(row.score) || 0));
        const index = Math.min(
            binCount - 1,
            Math.floor((score / (maxPossibleScore + 1)) * binCount)
        );
        bins[index].count += 1;
    });

    const maxFrequency = Math.max(...bins.map((bin) => bin.count), 1);
    const list = document.createElement("div");
    list.className = "mobile-hist-columns";

    bins.forEach((bin, index) => {
        const column = document.createElement("div");
        column.className = "mobile-hist-column";
        column.title = `${bin.start}-${bin.end}: ${bin.count}`;

        const value = document.createElement("span");
        value.className = "mobile-hist-value";
        value.textContent = bin.count > 0 ? String(bin.count) : "";

        const barWrap = document.createElement("div");
        barWrap.className = "mobile-hist-col-wrap";

        const bar = document.createElement("span");
        bar.className = "mobile-hist-col-bar";
        const heightRatio = (bin.count / maxFrequency) * 100;
        bar.style.height = `${Math.max(heightRatio, bin.count > 0 ? 2 : 0)}%`;

        const label = document.createElement("span");
        label.className = "mobile-hist-label";
        const min = document.createElement("span");
        min.className = "mobile-hist-label-min";
        min.textContent = String(bin.start);

        const separator = document.createElement("span");
        separator.className = "mobile-hist-label-sep";
        separator.textContent = "—";

        const max = document.createElement("span");
        max.className = "mobile-hist-label-max";
        max.textContent = String(bin.end);

        label.appendChild(min);
        label.appendChild(separator);
        label.appendChild(max);

        barWrap.appendChild(bar);
        column.appendChild(value);
        column.appendChild(barWrap);
        column.appendChild(label);
        list.appendChild(column);
    });

    chartHook.appendChild(list);
    chartHook.setAttribute("aria-label", `${toModeLabel(mode)} score histogram`);
}

function updateChartHook(mode, rows) {
    if (!chartSummary || !chartHook) {
        return;
    }

    if (isMobileHistogramMode()) {
        if (chartTitle) {
            chartTitle.textContent = "Score Histogram";
        }
        if (!rows || rows.length === 0) {
            chartSummary.textContent = `No ${toModeLabel(mode)} scores yet.`;
            renderMobileHistogram(mode, []);
            return;
        }
        const total = rows.reduce((sum, row) => sum + row.score, 0);
        const avg = total / rows.length;
        chartSummary.textContent = `${toModeLabel(mode)} score distribution (${rows.length} players, avg ${avg.toFixed(1)}).`;
        renderMobileHistogram(mode, rows);
        return;
    }

    if (chartTitle) {
        chartTitle.textContent = "Average Performance (Chart Hook)";
    }
    if (!rows || rows.length === 0) {
        chartSummary.textContent = `No ${toModeLabel(mode)} data yet for average calculations.`;
        chartHook.textContent = "Chart hook ready. Once scores exist, this section will carry average-score bar data.";
        return;
    }

    const total = rows.reduce((sum, row) => sum + row.score, 0);
    const avg = total / rows.length;
    chartSummary.textContent = `${toModeLabel(mode)} average score (top unique players): ${avg.toFixed(2)} across ${rows.length} players.`;
    chartHook.textContent = `Future bar graph input: { mode: "${mode}", averageScore: ${avg.toFixed(2)}, sampleSize: ${rows.length} }`;
}

async function loadLeaderboard(mode) {
    currentMode = mode;
    setModeButtons(mode);
    setLoading(true);

    if (!supabaseClient) {
        renderRows([]);
        updateChartHook(mode, []);
        setStatus("Leaderboard unavailable right now.", false);
        setLoading(false);
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from(LEADERBOARD_TABLE)
            .select("username,score,created_at")
            .eq("mode", mode)
            .order("score", { ascending: false })
            .order("created_at", { ascending: true })
            .limit(FETCH_LIMIT);

        if (error) {
            renderRows([]);
            updateChartHook(mode, []);
            setStatus("Failed to load leaderboard.", false);
            setLoading(false);
            return;
        }

        const rows = toDenseRankedRows(data || []);
        renderRows(rows);
        updateChartHook(mode, rows);
        setStatus(`Showing top ${MAX_ROWS} unique players for ${toModeLabel(mode)}.`, true);
        setLoading(false);
    } catch (error) {
        renderRows([]);
        updateChartHook(mode, []);
        setStatus("Failed to load leaderboard.", false);
        setLoading(false);
    }
}

Object.keys(modeButtons).forEach((mode) => {
    modeButtons[mode].addEventListener("click", function () {
        if (mode === currentMode) {
            return;
        }
        loadLeaderboard(mode);
    });
});

if (typeof mobileHistogramQuery.addEventListener === "function") {
    mobileHistogramQuery.addEventListener("change", function () {
        loadLeaderboard(currentMode);
    });
} else if (typeof mobileHistogramQuery.addListener === "function") {
    mobileHistogramQuery.addListener(function () {
        loadLeaderboard(currentMode);
    });
}

loadLeaderboard(currentMode);
