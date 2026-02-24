(function (root, factory) {
    const core = factory();
    if (typeof module !== "undefined" && module.exports) {
        module.exports = core;
    }
    root.FlagUpCore = core;
})(typeof window !== "undefined" ? window : globalThis, function () {
    function normalizeAnswer(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9 ]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function normalizeCountryData(rawList, desiredCountryCount) {
        const map = new Map();

        rawList.forEach((entry) => {
            const country = entry && entry.name && entry.name.common ? String(entry.name.common).trim() : "";
            const code = entry && entry.cca2 ? String(entry.cca2).toLowerCase().trim() : "";

            if (!country || code.length !== 2) {
                return;
            }

            if (entry.independent === false) {
                return;
            }

            map.set(code, { country, code });
        });

        const normalized = Array.from(map.values()).sort((a, b) => a.country.localeCompare(b.country));
        if (normalized.length > desiredCountryCount) {
            return normalized.slice(0, desiredCountryCount);
        }
        return normalized;
    }

    function buildCountryLookup(countryPool) {
        const lookup = new Map();
        countryPool.forEach((entry) => {
            lookup.set(normalizeAnswer(entry.country), entry.country);
        });
        return lookup;
    }

    function buildMediumHint(countryName) {
        const clean = String(countryName || "").trim();
        if (!clean) {
            return { first: "", last: "" };
        }
        return {
            first: clean.charAt(0),
            last: clean.charAt(clean.length - 1)
        };
    }

    function evaluateTypedGuess(mode, typedValue, correctCountry, normalizedLookup) {
        const normalizedTyped = normalizeAnswer(typedValue);
        const normalizedCorrect = normalizeAnswer(correctCountry);

        if (!normalizedTyped) {
            return { status: "empty" };
        }

        if (normalizedTyped === normalizedCorrect) {
            return { status: "correct" };
        }

        const matchedCountry = normalizedLookup.get(normalizedTyped);
        if (matchedCountry && normalizeAnswer(matchedCountry) === normalizedCorrect) {
            return { status: "correct" };
        }

        if (mode === "expert") {
            if (matchedCountry) {
                return { status: "expert_fail_country", matchedCountry };
            }
            return { status: "expert_fail" };
        }

        if (matchedCountry) {
            return { status: "wrong_other_country", matchedCountry };
        }
        return { status: "wrong" };
    }

    return {
        normalizeAnswer,
        normalizeCountryData,
        buildCountryLookup,
        buildMediumHint,
        evaluateTypedGuess
    };
});
