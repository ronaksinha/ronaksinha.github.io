(function () {
    const core = window.FlagUpCore;

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message} (expected: ${expected}, actual: ${actual})`);
        }
    }

    function runTests() {
        const tests = [
            function normalizeAnswer_strips_accents_and_punctuation() {
                const out = core.normalizeAnswer("  Cote d'Ivoire!!  ");
                assertEqual(out, "cote d ivoire", "normalizeAnswer should normalize punctuation");
            },
            function normalizeCountryData_filters_and_limits() {
                const raw = [
                    { name: { common: "Zed" }, cca2: "ZZ", independent: true },
                    { name: { common: "Able" }, cca2: "AA", independent: true },
                    { name: { common: "Proto" }, cca2: "PP", independent: false },
                    { name: { common: "BadCode" }, cca2: "TOOLONG", independent: true }
                ];
                const out = core.normalizeCountryData(raw, 2);
                assertEqual(out.length, 2, "normalizeCountryData should cap list");
                assertEqual(out[0].country, "Able", "normalizeCountryData should sort alphabetically");
                assertEqual(out[1].country, "Zed", "normalizeCountryData should keep valid independent countries");
            },
            function buildCountryLookup_maps_normalized_names() {
                const lookup = core.buildCountryLookup([
                    { country: "Cote d'Ivoire", code: "ci" },
                    { country: "United States", code: "us" }
                ]);
                assertEqual(lookup.get("cote d ivoire"), "Cote d'Ivoire", "lookup should use normalized keys");
            },
            function buildMediumHint_returns_first_and_last_letter() {
                const hint = core.buildMediumHint("Australia");
                assertEqual(hint.first, "A", "hint should include first letter");
                assertEqual(hint.last, "a", "hint should include last letter");
            },
            function evaluateTypedGuess_hard_other_country() {
                const lookup = core.buildCountryLookup([
                    { country: "Austria", code: "at" },
                    { country: "Australia", code: "au" }
                ]);
                const result = core.evaluateTypedGuess("hard", "Australia", "Austria", lookup);
                assertEqual(result.status, "wrong_other_country", "hard mode should allow retries but detect other countries");
                assertEqual(result.matchedCountry, "Australia", "hard mode should report matched country");
            },
            function evaluateTypedGuess_expert_other_country_is_fail() {
                const lookup = core.buildCountryLookup([
                    { country: "Austria", code: "at" },
                    { country: "Australia", code: "au" }
                ]);
                const result = core.evaluateTypedGuess("expert", "Australia", "Austria", lookup);
                assertEqual(result.status, "expert_fail_country", "expert mode should fail on wrong valid country");
            },
            function evaluateTypedGuess_correct() {
                const lookup = core.buildCountryLookup([
                    { country: "Japan", code: "jp" }
                ]);
                const result = core.evaluateTypedGuess("medium", "japan", "Japan", lookup);
                assertEqual(result.status, "correct", "correct answer should pass in typing modes");
            }
        ];

        const results = [];
        tests.forEach((testFn) => {
            const name = testFn.name || "anonymous_test";
            try {
                testFn();
                results.push({ name, status: "pass" });
            } catch (error) {
                results.push({ name, status: "fail", error: error.message });
            }
        });

        return results;
    }

    window.FlagUpCoreTests = { runTests };
})();
