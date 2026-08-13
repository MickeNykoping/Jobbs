import fs from "fs";

async function fetchJobsForRegion(regionId, regionName) {
    const itField = "apaJ_2ja_LuF"; // Data/IT
    const LIMIT = 100;
    let regionJobs = [];
    let offset = 0;

    console.log(`--- Startar hämtning för ${regionName} (${regionId}) ---`);

    while (offset < 500) {
        const url = `https://jobsearch.api.jobtechdev.se/search?occupation-field=${itField}&region=${regionId}&limit=${LIMIT}&offset=${offset}`;
        console.log(`Anropar: ${url}`);
        
        try {
            const res = await fetch(url, {
                headers: { "accept": "application/json" }
            });

            if (!res.ok) {
                console.error(`HTTP Fel (${regionName}): ${res.status}`);
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

        // Södermanlands län: xS38_386_2L2
        // Östergötlands län: 4395_173_ngM
        const sodermanlandJobs = await fetchJobsForRegion("xS38_386_2L2", "Södermanlands län");
        const ostergotlandJobs = await fetchJobsForRegion("4395_173_ngM", "Östergötlands län");

        console.log(`Antal i Södermanland: ${sodermanlandJobs.length}`);
        console.log(`Antal i Östergötland: ${ostergotlandJobs.length}`);

        const combinedJobs = [...sodermanlandJobs, ...ostergotlandJobs];
        const uniqueJobs = Array.from(new Map(combinedJobs.map(job => [job.id, job])).values());

        console.log(`Totalt unika IT-jobb: ${uniqueJobs.length}`);

        fs.writeFileSync("jobs.json", JSON.stringify(uniqueJobs, null, 2));
        console.log("jobs.json sparades framgångsrikt!");

    } catch (err) {
        console.error("Fel vid hämtning:", err);
        fs.writeFileSync("jobs.json", JSON.stringify([], null, 2));
    }
}

updateJobs();
