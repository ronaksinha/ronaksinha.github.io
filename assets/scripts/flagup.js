const COUNTRY_API_URL = "https://restcountries.com/v3.1/all?fields=name,cca2,independent";
const DESIRED_COUNTRY_COUNT = 197;
const MEDIUM_HINT_COUNT = 6;
const Core = window.FlagUpCore;

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
const hardAnswerEl = document.getElementById("hard-answer");
const countryInput = document.getElementById("country-input");
const submitAnswerBtn = document.getElementById("submit-answer-btn");
const hintRow = document.getElementById("hint-row");
const hintBtn = document.getElementById("hint-btn");

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

function updateStats() {
    scoreLabel.textContent = `Score: ${score}`;
    roundLabel.textContent = `Round: ${round} / ${totalRounds}`;
    hintLabel.textContent = `Hints: ${hintsRemaining}`;
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

function rebuildCountryLookup() {
    normalizedCountryLookup = Core.buildCountryLookup(countryPool);
}

async function loadCountryPool() {
    try {
        const response = await fetch(COUNTRY_API_URL);
        if (!response.ok) {
            throw new Error(`Country API failed with ${response.status}`);
        }

        const raw = await response.json();
        const normalized = normalizeCountryData(raw);

        if (normalized.length >= 4) {
            countryPool = normalized;
            return;
        }
    } catch (error) {
        console.error("Falling back to local flag list.", error);
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
}

function disableChoices() {
    Array.from(choicesEl.children).forEach((button) => {
        button.disabled = true;
    });
}

function handleChoice(button, selectedCountry) {
    if (answered || !currentQuestion) {
        return;
    }

    answered = true;
    const isCorrect = selectedCountry === currentQuestion.country;

    if (isCorrect) {
        score += 1;
        button.classList.add("correct");
        setFeedback(`Correct. That is ${currentQuestion.country}.`, true);
    } else {
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
    if (answered || !currentQuestion || !isTypingMode()) {
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
        answered = true;
        if (result.status === "expert_fail_country") {
            setFeedback(`Expert fail. ${result.matchedCountry} is valid, but not this flag.`, false);
        } else {
            setFeedback("Expert fail. Wrong answer.", false);
        }
        updateStats();
        window.setTimeout(function () {
            nextQuestion();
        }, 320);
        return;
    }

    if (result.status === "wrong_other_country") {
        setFeedback(`That's ${result.matchedCountry}, but this flag is different. Try again.`, false);
    } else {
        setFeedback("Not quite. Try again.", false);
    }
    countryInput.focus();
    countryInput.select();
}

function useMediumHint() {
    if (currentMode !== "medium" || !currentQuestion || answered) {
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

function finishQuiz() {
    currentQuestion = null;
    answered = true;
    flagImage.removeAttribute("src");
    flagImage.alt = "Flag quiz complete";
    choicesEl.innerHTML = "";
    setFeedback(`Quiz complete. Final score: ${score} / ${totalRounds}.`, true);
    nextBtn.disabled = true;
    countryInput.disabled = true;
    submitAnswerBtn.disabled = true;
    hintBtn.disabled = true;
}

function nextQuestion() {
    if (questionQueue.length === 0) {
        finishQuiz();
        return;
    }

    round += 1;
    answered = false;
    hintedThisQuestion = false;
    currentQuestion = questionQueue.pop();

    const options = buildOptions(currentQuestion.country);
    flagImage.src = `https://flagcdn.com/w320/${currentQuestion.code}.png`;
    flagImage.alt = `Flag of ${currentQuestion.country}`;

    if (currentMode === "easy") {
        renderChoices(options);
    } else {
        choicesEl.innerHTML = "";
        countryInput.value = "";
        countryInput.disabled = false;
        submitAnswerBtn.disabled = false;
        hintBtn.disabled = currentMode !== "medium";
        countryInput.focus();
    }

    feedbackEl.textContent = "";
    feedbackEl.style.color = "#c7d3e3";
    nextBtn.disabled = false;
    updateStats();
}

function restartGame() {
    score = 0;
    round = 0;
    if (currentMode === "medium") {
        hintsRemaining = MEDIUM_HINT_COUNT;
    }
    questionQueue = shuffle(countryPool);
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
submitAnswerBtn.addEventListener("click", handleTypedSubmit);
hintBtn.addEventListener("click", useMediumHint);
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

    const normalizedTyped = normalizeAnswer(countryInput.value);
    const normalizedCorrect = normalizeAnswer(currentQuestion.country);

    if (normalizedTyped === normalizedCorrect) {
        handleTypedSubmit();
        return;
    }

    const matchedCountry = normalizedCountryLookup.get(normalizedTyped);
    if (matchedCountry && normalizedTyped !== normalizedCorrect) {
        setFeedback(`You're thinking of ${matchedCountry}, but this flag is different.`, false);
    } else if (!feedbackEl.textContent.startsWith("Loaded ")) {
        feedbackEl.textContent = "";
        feedbackEl.style.color = "#c7d3e3";
    }
});

initGame();
