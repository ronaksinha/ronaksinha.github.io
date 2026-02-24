const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../scripts/flagup-core.js");

test("normalizeAnswer strips accents and punctuation", () => {
  const out = core.normalizeAnswer("  Cote d'Ivoire!!  ");
  assert.equal(out, "cote d ivoire");
});

test("normalizeCountryData filters invalid entries and limits count", () => {
  const raw = [
    { name: { common: "Zed" }, cca2: "ZZ", independent: true },
    { name: { common: "Able" }, cca2: "AA", independent: true },
    { name: { common: "Proto" }, cca2: "PP", independent: false },
    { name: { common: "BadCode" }, cca2: "TOOLONG", independent: true }
  ];

  const out = core.normalizeCountryData(raw, 2);
  assert.equal(out.length, 2);
  assert.equal(out[0].country, "Able");
  assert.equal(out[1].country, "Zed");
});

test("buildCountryLookup maps normalized names", () => {
  const lookup = core.buildCountryLookup([
    { country: "Cote d'Ivoire", code: "ci" },
    { country: "United States", code: "us" }
  ]);

  assert.equal(lookup.get("cote d ivoire"), "Cote d'Ivoire");
});

test("buildMediumHint returns first and last letter", () => {
  const hint = core.buildMediumHint("Australia");
  assert.equal(hint.first, "A");
  assert.equal(hint.last, "a");
});

test("evaluateTypedGuess hard mode detects wrong other country", () => {
  const lookup = core.buildCountryLookup([
    { country: "Austria", code: "at" },
    { country: "Australia", code: "au" }
  ]);
  const result = core.evaluateTypedGuess("hard", "Australia", "Austria", lookup);
  assert.equal(result.status, "wrong_other_country");
  assert.equal(result.matchedCountry, "Australia");
});

test("evaluateTypedGuess expert mode fails on wrong valid country", () => {
  const lookup = core.buildCountryLookup([
    { country: "Austria", code: "at" },
    { country: "Australia", code: "au" }
  ]);
  const result = core.evaluateTypedGuess("expert", "Australia", "Austria", lookup);
  assert.equal(result.status, "expert_fail_country");
});

test("evaluateTypedGuess accepts alias mapped to correct country", () => {
  const lookup = core.buildCountryLookup([{ country: "United States", code: "us" }]);
  lookup.set(core.normalizeAnswer("USA"), "United States");
  const result = core.evaluateTypedGuess("hard", "USA", "United States", lookup);
  assert.equal(result.status, "correct");
});

