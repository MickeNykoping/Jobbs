import fs from "fs";

async function fetchJobsForRegion(regionId, regionName) {
    const itField = "apaJ_2ja_LuF"; // Data/IT
    const LIMIT = 100;
    let regionJobs = [];
    let offset = 0;

    console.log(`--- Startar hämtning för ${regionName} (${regionId}) ---`);

    while (offset < 500) {
        const url = `https://jobsearch.api.jobtechdev.se/search?occupation-field=${itField}&region=${regionId}&limit=${LIMIT}&offset=${offset}`;
        console.log(`Anropar URL: ${url}`);
        
        try {
            const res = await fetch(url, {
                headers: { "accept": "application/json" }
            });

            console.log(`HTTP Status (${regionName}):`, res.status);

            if (!res.ok) {
                const errText = await res.text();
                console.error(`Fel från API (${regionName}): ${res.status} - ${errText}`);
                break;
            }

            const data = await res.json();
            const hits = data?.hits || [];

            console.log(`Mottog ${hits.length} träffar från API för ${regionName}.`);

            if (hits.length === 0) break;

            regionJobs = regionJobs.concat(hits);
            offset += LIMIT;

            if (hits.length < LIMIT) break;
        } catch (fetchErr) {
            console.error(`Nätverksfel vid anrop till ${regionName}:`, fetchErr);
            break;
        }
    }

    return regionJobs;
}

async function updateJobs() {
    try {
        console.log("=== BÖRJAR UPPDATERA JOBS.JSON ===");

        const sodermanlandJobs = await fetchJobsForRegion("xS38_386_2L2", "Södermanland");
        const ostergotlandJobs = await fetchJobsForRegion("4395_173_ngM", "Östergötland");

        console.log(`Resultat Södermanland: ${sodermanlandJobs.length} jobb`);
        console.log(`Resultat Östergötland: ${ostergotlandJobs.length} jobb`);

        const combinedJobs = [...sodermanlandJobs, ...ostergotlandJobs];
        const uniqueJobs = Array.from(new Map(combinedJobs.map(job => [job.id, job])).values());

        console.log(`Totalt unika jobb att spara: ${uniqueJobs.length}`);

        if (uniqueJobs.length > 0) {
            console.log("Exempel på första jobbet:", uniqueJobs[0].headline, "| Region:", uniqueJobs[0].workplace_address?.region);
        }

        fs.writeFileSync("jobs.json", JSON.stringify(uniqueJobs, null, 2));
        console.log(">>> SUCCESS: jobs.json har sparats! <<<");

    } catch (err) {
        console.error("KRITISKT FEL i updateJobs:", err);
        fs.writeFileSync("jobs.json", JSON.stringify([], null, 2));
    }
}

updateJobs();
