const LOCAL_COUNTRY_DATA_URL = "../assets/data/countries-195.json";
const DESIRED_COUNTRY_COUNT = 195;
const MEDIUM_HINT_COUNT = 6;
const Core = window.FlagUpCore;
const COUNTRY_ALIASES = {
    "United States": ["usa", "us", "u.s.", "u.s.a."],
    "United Kingdom": ["uk", "gbr", "great britain", "britain"],
    "United Arab Emirates": ["uae"],
    "Czechia": ["czech republic"],
    "Eswatini": ["swaziland"],
    "Myanmar": ["burma"],
    "Cote d'Ivoire": ["ivory coast"],
    "Democratic Republic of the Congo": ["drc", "congo kinshasa"],
    "Republic of the Congo": ["congo brazzaville"],
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
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const modeEasyBtn = document.getElementById("mode-easy-btn");
const modeMediumBtn = document.getElementById("mode-medium-btn");
const modeHardBtn = document.getElementById("mode-hard-btn");
const modeExpertBtn = document.getElementById("mode-expert-btn");
const modeToggleBtn = document.getElementById("mode-toggle-btn");
const modeRow = document.getElementById("mode-row");
const hardAnswerEl = document.getElementById("hard-answer");
const countryInput = document.getElementById("country-input");
const hintRow = document.getElementById("hint-row");
const hintBtn = document.getElementById("hint-btn");
const giveUpBtn = document.getElementById("giveup-btn");
const gameOverModal = document.getElementById("gameover-modal");
const gameOverTitle = document.getElementById("gameover-title");
const gameOverMessage = document.getElementById("gameover-message");
const gameOverScore = document.getElementById("gameover-score");
const gameOverBest = document.getElementById("gameover-best");
const gameOverMissedWrap = document.getElementById("gameover-missed-wrap");
const gameOverMissedList = document.getElementById("gameover-missed-list");
const retryBtn = document.getElementById("retry-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const phoneDifficultyMenuQuery = window.matchMedia("(max-width: 430px)");
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

function updateModeToggleLabel() {
    if (!modeToggleBtn) {
        return;
    }
    const expanded = modeToggleBtn.getAttribute("aria-expanded") === "true";
    const suffix = isPhoneDifficultyMenu() ? (expanded ? " ▲" : " ▼") : "";
    modeToggleBtn.textContent = `Difficulty: ${toModeLabel(currentMode)}${suffix}`;
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
}

function collapseDifficultyMenuOnPhone() {
    if (!modeToggleBtn || !modeRow || !isPhoneDifficultyMenu()) {
        return;
    }
    modeToggleBtn.setAttribute("aria-expanded", "false");
    modeRow.classList.add("collapsed");
    updateModeToggleLabel();
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

function setInteractionEnabled(enabled) {
    nextBtn.disabled = !enabled;
    countryInput.disabled = !enabled;
    hintBtn.disabled = !enabled || currentMode !== "medium" || hintedThisQuestion || hintsRemaining <= 0;
    giveUpBtn.disabled = !enabled || (currentMode !== "medium" && currentMode !== "hard");
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
        setFeedback("Enter a country name first.", false);
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
        setFeedback(`That's ${result.matchedCountry}, but this flag is different. Try again.`, false);
    } else {
        noteMissedFlag(typed);
        setFeedback("Not quite. Try again.", false);
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

    const hint = Core.buildMediumHint(currentQuestion.country);

    hintsRemaining -= 1;
    hintedThisQuestion = true;
    hintBtn.disabled = true;
    setFeedback(`Hint: starts with "${hint.first}" and ends with "${hint.last}".`, true);
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

function finishQuiz() {
    currentQuestion = null;
    answered = true;
    flagImage.removeAttribute("src");
    flagImage.alt = "Flag quiz complete";
    choicesEl.innerHTML = "";
    setFeedback(`Quiz complete. Final score: ${score} / ${totalRounds}.`, true);
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

    const options = buildOptions(currentQuestion.country);
    flagImage.src = `https://flagcdn.com/w320/${currentQuestion.code}.png`;
    flagImage.alt = `Flag of ${currentQuestion.country}`;

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
    updateModeUI();
    restartGame();
    collapseDifficultyMenuOnPhone();
}

async function initGame() {
    setFeedback("Loading country list...", true);
    nextBtn.disabled = true;
    restartBtn.disabled = true;
    disableChoices();

    await loadCountryPool();
    rebuildCountryLookup();

    restartBtn.disabled = false;
    setFeedback(`Loaded ${countryPool.length} countries.`, true);
    updateModeUI();
    restartGame();
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
    });
}
if (typeof phoneDifficultyMenuQuery.addEventListener === "function") {
    phoneDifficultyMenuQuery.addEventListener("change", syncDifficultyMenuState);
} else if (typeof phoneDifficultyMenuQuery.addListener === "function") {
    phoneDifficultyMenuQuery.addListener(syncDifficultyMenuState);
}
countryInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
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
        setFeedback(`You're thinking of ${result.matchedCountry}, but this flag is different.`, false);
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

    event.preventDefault();
    retryRun();
});

initGame();
syncDifficultyMenuState();
