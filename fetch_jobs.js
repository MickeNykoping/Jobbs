import fs from "fs";

const TAXONOMY_URL = "https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=region";
const IT_FIELD_ID = "apaJ_2ja_LuF"; // Data/IT (verifierad mot JobTech Taxonomy)
const LIMIT = 100;
const MAX_OFFSET = 2000; // höjd säkerhetsgräns (var 500, kunde klippa resultat)

const REGIONS = [
    { name: "Södermanlands län" },
    { name: "Östergötlands län" },
];

// Slår upp korrekta concept-ID:n för länen mot Taxonomy-API:et,
// istället för att lita på hårdkodade ID:n som kan bli fel/inaktuella.
async function resolveRegionIds() {
    console.log("Slår upp region-ID:n mot Taxonomy-API:et...");
    const res = await fetch(TAXONOMY_URL, { headers: { accept: "application/json" } });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Kunde inte hämta regionlista (HTTP ${res.status}): ${body}`);
    }

    const concepts = await res.json();

    for (const region of REGIONS) {
        const match = concepts.find(
            (c) => c["taxonomy/preferred-label"] === region.name
        );
        if (!match) {
            throw new Error(`Hittade inget region-ID för "${region.name}" i taxonomin.`);
        }
        region.id = match["taxonomy/id"];
        console.log(`  ${region.name} -> ${region.id}`);
    }
}

async function fetchJobsForRegion(regionId, regionName) {
    let regionJobs = [];
    let offset = 0;

    console.log(`--- Startar hämtning för ${regionName} (${regionId}) ---`);

    while (offset < MAX_OFFSET) {
        const url = `https://jobsearch.api.jobtechdev.se/search?occupation-field=${IT_FIELD_ID}&region=${regionId}&limit=${LIMIT}&offset=${offset}`;
        console.log(`Anropar: ${url}`);

        try {
            const res = await fetch(url, {
                headers: { accept: "application/json" },
            });

            if (!res.ok) {
                const body = await res.text();
                console.error(`HTTP Fel (${regionName}): ${res.status} - ${body}`);
                break;
            }

            const data = await res.json();
            const hits = data?.hits || [];

            console.log(`Hittade ${hits.length} jobb på denna sida för ${regionName}.`);

            if (hits.length === 0) break;

            regionJobs = regionJobs.concat(hits);
            offset += LIMIT;

            if (hits.length < LIMIT) break;
        } catch (fetchErr) {
            console.error(`Nätverksfel för ${regionName}:`, fetchErr);
            break;
        }
    }

    return regionJobs;
}

async function updateJobs() {
    try {
        console.log("=== HÄMTAR IT-JOBB SÖDERMANLAND & ÖSTERGÖTLAND ===");

        await resolveRegionIds();

        const results = [];
        for (const region of REGIONS) {
            const jobs = await fetchJobsForRegion(region.id, region.name);
            console.log(`Antal i ${region.name}: ${jobs.length}`);
            results.push(...jobs);
        }

        const uniqueJobs = Array.from(new Map(results.map((job) => [job.id, job])).values());

        console.log(`Totalt unika IT-jobb: ${uniqueJobs.length}`);

        fs.writeFileSync("jobs.json", JSON.stringify(uniqueJobs, null, 2));
        console.log("jobs.json sparades framgångsrikt!");
    } catch (err) {
        console.error("Fel vid hämtning:", err);
        // Skriv INTE över jobs.json med tom array vid fel - behåll senaste
        // lyckade resultat istället för att tömma sidan vid ett tillfälligt API-fel.
        if (!fs.existsSync("jobs.json")) {
            fs.writeFileSync("jobs.json", JSON.stringify([], null, 2));
        }
        process.exitCode = 1;
    }
}

updateJobs();
