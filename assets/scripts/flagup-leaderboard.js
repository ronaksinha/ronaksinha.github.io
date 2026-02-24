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
const chartSummary = document.getElementById("chart-summary");
const chartHook = document.getElementById("chart-hook");

let currentMode = "easy";

const supabaseClient = (window.supabase && typeof window.supabase.createClient === "function")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

function toModeLabel(mode) {
    return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function setStatus(text, ok) {
    leaderboardStatus.textContent = text;
    leaderboardStatus.style.color = ok ? "#86efac" : "#fecaca";
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
            score: entry.score,
            when: Number.isFinite(entry.createdMs)
                ? new Date(entry.createdMs).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                : "-"
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

        const rank = document.createElement("span");
        rank.className = "leaderboard-cell-rank";
        rank.textContent = `#${row.rank}`;

        const player = document.createElement("span");
        player.className = "leaderboard-cell-player";
        player.textContent = row.username;

        const score = document.createElement("span");
        score.className = "leaderboard-cell-score";
        score.textContent = String(row.score);

        const date = document.createElement("span");
        date.className = "leaderboard-cell-date";
        date.textContent = row.when;

        item.appendChild(rank);
        item.appendChild(player);
        item.appendChild(score);
        item.appendChild(date);
        leaderboardList.appendChild(item);
    });
}

function updateChartHook(mode, rows) {
    if (!chartSummary || !chartHook) {
        return;
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
    setStatus(`Loading ${toModeLabel(mode)} leaderboard...`, true);

    if (!supabaseClient) {
        renderRows([]);
        updateChartHook(mode, []);
        setStatus("Leaderboard unavailable right now.", false);
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
            return;
        }

        const rows = toDenseRankedRows(data || []);
        renderRows(rows);
        updateChartHook(mode, rows);
        setStatus(`Showing top ${MAX_ROWS} unique players for ${toModeLabel(mode)}.`, true);
    } catch (error) {
        renderRows([]);
        updateChartHook(mode, []);
        setStatus("Failed to load leaderboard.", false);
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

loadLeaderboard(currentMode);
