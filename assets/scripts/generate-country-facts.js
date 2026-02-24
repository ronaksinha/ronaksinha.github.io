const fs = require("fs/promises");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "../..");
const COUNTRY_LIST_PATH = path.join(ROOT_DIR, "assets/data/countries-195.json");
const OUTPUT_PATH = path.join(ROOT_DIR, "assets/data/country-facts.json");
const REST_COUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=cca2,name,capital,population,languages,unMember";
const WORLD_BANK_TOURISM_URL = "https://api.worldbank.org/v2/country/all/indicator/ST.INT.ARVL?format=json&per_page=20000";

const TOURIST_SPOT_HINTS = {
    af: "the Blue Mosque in Mazar-i-Sharif",
    ar: "Iguazu Falls",
    au: "the Great Barrier Reef",
    at: "Schonbrunn Palace",
    be: "Grand Place in Brussels",
    br: "Christ the Redeemer in Rio",
    ca: "Banff National Park",
    ch: "the Matterhorn region",
    cl: "Torres del Paine National Park",
    cn: "the Great Wall",
    co: "Cartagena's historic walled city",
    cr: "Arenal Volcano National Park",
    cz: "Prague Castle",
    de: "Neuschwanstein Castle",
    do: "Punta Cana beaches",
    eg: "the Pyramids of Giza",
    es: "the Sagrada Familia",
    fi: "Lapland's northern lights region",
    fr: "the Eiffel Tower",
    gb: "the Tower of London",
    gr: "the Acropolis of Athens",
    hr: "Dubrovnik's Old Town",
    hu: "the Buda Castle district",
    id: "Bali",
    ie: "the Cliffs of Moher",
    in: "the Taj Mahal",
    is: "the Blue Lagoon",
    it: "the Colosseum",
    jp: "Mount Fuji",
    ke: "the Maasai Mara",
    kr: "Gyeongbokgung Palace",
    ma: "Marrakesh medina",
    mx: "Chichen Itza",
    my: "Petronas Towers",
    nl: "Keukenhof gardens",
    no: "the Geirangerfjord",
    nz: "Milford Sound",
    pe: "Machu Picchu",
    ph: "Palawan",
    pl: "Krakow's Old Town",
    pt: "the Belem Tower",
    ro: "Bran Castle",
    ru: "Red Square",
    sa: "Al-Ula's heritage sites",
    se: "Stockholm's Gamla Stan",
    sg: "Gardens by the Bay",
    th: "the Grand Palace in Bangkok",
    tr: "Cappadocia",
    tz: "Serengeti National Park",
    us: "the Grand Canyon",
    vn: "Ha Long Bay",
    za: "Table Mountain"
};

const POPULAR_CITY_NOTES = {
    ar: "Buenos Aires",
    au: "Sydney",
    br: "Rio de Janeiro",
    ca: "Toronto",
    cn: "Shanghai",
    de: "Munich",
    eg: "Alexandria",
    es: "Barcelona",
    fr: "Paris",
    gb: "London",
    gr: "Thessaloniki",
    in: "Mumbai",
    it: "Milan",
    jp: "Osaka",
    kr: "Busan",
    mx: "Guadalajara",
    nl: "Amsterdam",
    no: "Bergen",
    pe: "Cusco",
    pt: "Porto",
    tr: "Istanbul",
    us: "New York City",
    vn: "Ho Chi Minh City",
    za: "Cape Town"
};

const GLOBAL_RANKING_NOTES = {
    fi: "This country has ranked #1 in the World Happiness Report in recent years.",
    sg: "This country is often ranked among the cleanest places globally.",
    ch: "This country often ranks highly for quality of life.",
    dk: "This country often ranks among the happiest countries.",
    is: "This country often ranks among the happiest countries.",
    nl: "This country often ranks among the happiest countries.",
    se: "This country often ranks among the happiest countries.",
    no: "This country often ranks highly for quality of life."
};

const ACTOR_ORIGIN_NOTES = {
    au: "A globally known actor from this country is Hugh Jackman.",
    at: "A globally known actor from this country is Christoph Waltz.",
    ca: "A globally known actor from this country is Ryan Reynolds.",
    cn: "A globally known actor from this country is Jackie Chan.",
    eg: "A globally known actor from this country is Omar Sharif.",
    fr: "A globally known actor from this country is Marion Cotillard.",
    de: "A globally known actor from this country is Diane Kruger.",
    gb: "A globally known actor from this country is Daniel Craig.",
    in: "A globally known actor from this country is Shah Rukh Khan.",
    ie: "A globally known actor from this country is Cillian Murphy.",
    it: "A globally known actor from this country is Sophia Loren.",
    jp: "A globally known actor from this country is Ken Watanabe.",
    kr: "A globally known actor from this country is Lee Byung-hun.",
    mx: "A globally known actor from this country is Salma Hayek.",
    nz: "A globally known actor from this country is Russell Crowe.",
    pt: "A globally known actor from this country is Daniela Ruah.",
    se: "A globally known actor from this country is Alicia Vikander.",
    tr: "A globally known actor from this country is Haluk Bilginer.",
    us: "A globally known actor from this country is Denzel Washington.",
    za: "A globally known actor from this country is Charlize Theron."
};

const ANIMAL_NOTES = {
    au: "A native animal often associated with this country is the kangaroo.",
    ca: "A widely recognized native animal here is the beaver.",
    cn: "A globally famous native animal from this country is the giant panda.",
    in: "A well-known native animal here is the Bengal tiger.",
    id: "A famous native reptile from this country is the Komodo dragon.",
    ke: "A famous native mammal here is the African elephant.",
    mg: "A signature native animal from this country is the lemur.",
    nz: "A native animal strongly associated with this country is the kiwi bird.",
    no: "A notable native marine mammal here is the orca.",
    pe: "A native animal strongly associated with this country is the llama.",
    ru: "A notable native big cat here is the Siberian tiger.",
    za: "A famous native mammal here is the lion.",
    th: "A native animal associated with this country is the Asian elephant.",
    tz: "A notable native mammal here is the giraffe.",
    us: "A classic native bird associated with this country is the bald eagle."
};

const HISTORICAL_EVENT_NOTES = {
    cn: "This country saw the 1949 founding of the People's Republic of China.",
    de: "This country saw the fall of the Berlin Wall in 1989.",
    eg: "This country saw the 1922 discovery of Tutankhamun's tomb.",
    fr: "This country saw the French Revolution begin in 1789.",
    gb: "This country hosted the signing of the Magna Carta in 1215.",
    gr: "This country hosted the first modern Olympic Games in 1896.",
    in: "This country gained independence in 1947.",
    it: "This country saw the 79 CE eruption of Vesuvius that buried Pompeii.",
    jp: "This country underwent the Meiji Restoration in 1868.",
    mx: "This country saw the start of its War of Independence in 1810.",
    nl: "This country hosted the signing of the Treaty of Maastricht in 1992.",
    no: "This country is where the Nobel Peace Prize is awarded.",
    pl: "This country saw the rise of the Solidarity movement in 1980.",
    pt: "This country saw the Carnation Revolution in 1974.",
    ru: "This country saw the October Revolution in 1917.",
    tr: "This country became a modern republic in 1923.",
    us: "This country signed its Declaration of Independence in 1776.",
    za: "This country held its first fully democratic election in 1994."
};

const OLYMPIC_HOST_YEARS = {
    au: { summer: [1956, 2000], winter: [] },
    at: { summer: [], winter: [1964, 1976] },
    be: { summer: [1920], winter: [] },
    br: { summer: [2016], winter: [] },
    ca: { summer: [1976], winter: [1988, 2010] },
    ch: { summer: [], winter: [1928, 1948] },
    cn: { summer: [2008], winter: [2022] },
    de: { summer: [1936, 1972], winter: [1936] },
    fi: { summer: [1952], winter: [] },
    fr: { summer: [1900, 1924, 2024], winter: [1924, 1968, 1992] },
    gb: { summer: [1908, 1948, 2012], winter: [] },
    gr: { summer: [1896, 2004], winter: [] },
    it: { summer: [1960], winter: [1956, 2006, 2026] },
    jp: { summer: [1964, 2020], winter: [1972, 1998] },
    kr: { summer: [1988], winter: [2018] },
    mx: { summer: [1968], winter: [] },
    nl: { summer: [1928], winter: [] },
    no: { summer: [], winter: [1952, 1994] },
    ru: { summer: [1980], winter: [2014] },
    se: { summer: [1912], winter: [] },
    us: { summer: [1904, 1932, 1984, 1996, 2028], winter: [1932, 1960, 1980, 2002] }
};

function formatYearList(years) {
    return years
        .map((year) => Number(year))
        .filter((year) => Number.isFinite(year))
        .sort((a, b) => a - b)
        .join(", ");
}

function formatNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
        return "";
    }
    return new Intl.NumberFormat("en-US").format(n);
}

function toArray(value) {
    return Array.isArray(value) ? value : [];
}

function buildPopulationRanks(countryList, metaByCode) {
    const ranked = countryList
        .map((entry) => {
            const code = String(entry.code || "").toLowerCase();
            const meta = metaByCode.get(code);
            return {
                code,
                population: Number(meta && meta.population) || 0
            };
        })
        .filter((entry) => entry.code && entry.population > 0)
        .sort((a, b) => b.population - a.population);

    const rankByCode = new Map();
    ranked.forEach((entry, index) => {
        rankByCode.set(entry.code, index + 1);
    });
    return rankByCode;
}

function normalizeWorldBankRows(raw) {
    if (!Array.isArray(raw) || raw.length < 2 || !Array.isArray(raw[1])) {
        return [];
    }
    return raw[1];
}

function buildTourismRanks(worldBankRows) {
    const latestByIso2 = new Map();

    worldBankRows.forEach((row) => {
        const iso2 = String(row && row.countryiso2code || "").toLowerCase();
        const value = Number(row && row.value);
        const year = Number(row && row.date);

        if (!iso2 || !Number.isFinite(value) || value <= 0 || !Number.isFinite(year)) {
            return;
        }

        const current = latestByIso2.get(iso2);
        if (!current || year > current.year) {
            latestByIso2.set(iso2, { year, value });
        }
    });

    const ranked = [...latestByIso2.entries()]
        .map(([code, payload]) => ({ code, year: payload.year, value: payload.value }))
        .sort((a, b) => b.value - a.value);

    const rankByIso2 = new Map();
    ranked.forEach((entry, index) => {
        rankByIso2.set(entry.code, {
            rank: index + 1,
            year: entry.year,
            value: entry.value
        });
    });
    return rankByIso2;
}

function codeSeed(code) {
    return String(code || "")
        .split("")
        .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function buildFacts(localName, code, meta, populationRankByCode, tourismRankByIso2) {
    const capital = toArray(meta.capital)[0];
    const population = formatNumber(meta.population);
    const languageNames = meta.languages && typeof meta.languages === "object"
        ? Object.values(meta.languages).map((name) => String(name || "").trim()).filter(Boolean)
        : [];
    const languageCount = languageNames.length;
    const rankByPopulation = populationRankByCode.get(code);
    const tourism = tourismRankByIso2.get(code);
    const seed = codeSeed(code);

    const facts = [];

    if (capital) {
        facts.push(`The capital city is ${capital}.`);
    }

    if (POPULAR_CITY_NOTES[code]) {
        facts.push(`A major city here is ${POPULAR_CITY_NOTES[code]}.`);
    }
    let hasSpecialFact = false;

    if (tourism && tourism.year) {
        facts.push(`This country ranks #${tourism.rank} in international arrivals (World Bank, ${tourism.year}).`);
        hasSpecialFact = true;
    }

    if (TOURIST_SPOT_HINTS[code]) {
        facts.push(`A popular destination here is ${TOURIST_SPOT_HINTS[code]}.`);
        hasSpecialFact = true;
    }

    if (GLOBAL_RANKING_NOTES[code]) {
        facts.push(GLOBAL_RANKING_NOTES[code]);
        hasSpecialFact = true;
    }

    if (ACTOR_ORIGIN_NOTES[code]) {
        facts.push(ACTOR_ORIGIN_NOTES[code]);
        hasSpecialFact = true;
    }

    if (ANIMAL_NOTES[code]) {
        facts.push(ANIMAL_NOTES[code]);
        hasSpecialFact = true;
    }

    if (HISTORICAL_EVENT_NOTES[code]) {
        facts.push(HISTORICAL_EVENT_NOTES[code]);
        hasSpecialFact = true;
    }

    if (OLYMPIC_HOST_YEARS[code]) {
        const summerYears = formatYearList(OLYMPIC_HOST_YEARS[code].summer || []);
        const winterYears = formatYearList(OLYMPIC_HOST_YEARS[code].winter || []);
        if (summerYears) {
            facts.push(`This country hosted the Summer Olympics in ${summerYears}.`);
            hasSpecialFact = true;
        }
        if (winterYears) {
            facts.push(`This country hosted the Winter Olympics in ${winterYears}.`);
            hasSpecialFact = true;
        }
    }

    if (languageCount === 1) {
        facts.push(`This country's official or primary language is ${languageNames[0]}.`);
    } else if (languageCount > 1) {
        facts.push(`This country has ${languageCount} official or widely used language(s).`);
    }

    const includePopulationRank = Boolean(rankByPopulation) && rankByPopulation <= 12 && seed % 2 === 0;
    const includePopulationSize = Boolean(population) && !hasSpecialFact && seed % 5 === 0;
    let hasPopulationFact = false;

    if (includePopulationRank) {
        facts.push(`This country ranks #${rankByPopulation} by population among countries in this quiz.`);
        hasPopulationFact = true;
    } else if (includePopulationSize) {
        facts.push(`This country has about ${population} people.`);
        hasPopulationFact = true;
    }

    if (!capital && !hasSpecialFact && !hasPopulationFact && facts.length < 2 && typeof meta.unMember === "boolean") {
        facts.push(meta.unMember
            ? "This country is a United Nations member state."
            : "This country is not listed as a United Nations member state.");
    }

    return facts.slice(0, 10);
}

async function main() {
    const countriesRaw = await fs.readFile(COUNTRY_LIST_PATH, "utf8");
    const countryList = JSON.parse(countriesRaw.replace(/^\uFEFF/, ""));

    const response = await fetch(REST_COUNTRIES_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch metadata (${response.status})`);
    }

    const allMeta = await response.json();
    const metaByCode = new Map(
        (Array.isArray(allMeta) ? allMeta : [])
            .filter((entry) => entry && entry.cca2)
            .map((entry) => [String(entry.cca2).toLowerCase(), entry])
    );

    const populationRankByCode = buildPopulationRanks(countryList, metaByCode);
    let tourismRankByIso2 = new Map();
    try {
        const tourismResponse = await fetch(WORLD_BANK_TOURISM_URL);
        if (!tourismResponse.ok) {
            throw new Error(`Failed to fetch tourism data (${tourismResponse.status})`);
        }
        const tourismRaw = await tourismResponse.json();
        const tourismRows = normalizeWorldBankRows(tourismRaw);
        tourismRankByIso2 = buildTourismRanks(tourismRows);
    } catch (error) {
        console.warn("Tourism ranking data unavailable; continuing without that ranking source.", error.message || error);
    }

    const output = (Array.isArray(countryList) ? countryList : [])
        .filter((entry) => entry && entry.country && entry.code)
        .map((entry) => {
            const code = String(entry.code).toLowerCase();
            const localName = String(entry.country);
            const meta = metaByCode.get(code);

            if (!meta) {
                return {
                    country: localName,
                    code,
                    facts: [`The flag of ${localName} is a national symbol of the country.`]
                };
            }

            return {
                country: localName,
                code,
                facts: buildFacts(localName, code, meta, populationRankByCode, tourismRankByIso2)
            };
        });

    await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log(`Wrote ${output.length} countries to ${OUTPUT_PATH}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
