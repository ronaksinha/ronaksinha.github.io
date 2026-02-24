const SUPABASE_URL = "https://cgqazsregqlcgnkehbwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BD9Qn5CNFN7VgjgDdmCJTw_Bv6INgQ0";
const LEADERBOARD_TABLE = "leaderboard_scores";

const modeButtons = {
    easy: document.getElementById("lb-mode-easy"),
    medium: document.getElementById("lb-mode-medium"),
    hard: document.getElementById("lb-mode-hard"),
    expert: document.getElementById("lb-mode-expert")
};
const leaderboardStatus = document.getElementById("leaderboard-status");
const leaderboardList = document.getElementById("leaderboard-list");

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

function renderRows(rows) {
    leaderboardList.innerHTML = "";
    if (!rows || rows.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No scores yet.";
        leaderboardList.appendChild(item);
        return;
    }

    rows.forEach((row, index) => {
        const item = document.createElement("li");
        item.textContent = `${index + 1}. ${row.username} — ${row.score}`;
        leaderboardList.appendChild(item);
    });
}

async function loadLeaderboard(mode) {
    currentMode = mode;
    setModeButtons(mode);
    setStatus(`Loading ${toModeLabel(mode)} leaderboard...`, true);

    if (!supabaseClient) {
        renderRows([]);
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
            .limit(10);

        if (error) {
            renderRows([]);
            setStatus("Failed to load leaderboard.", false);
            return;
        }

        renderRows(data || []);
        setStatus(`Showing top 10 for ${toModeLabel(mode)}.`, true);
    } catch (error) {
        renderRows([]);
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
