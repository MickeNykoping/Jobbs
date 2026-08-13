import fs from "fs";

async function fetchJobsForRegion(regionId) {
    const itField = "apaJ_2ja_LuF"; // Data/IT
    const LIMIT = 100;
    let regionJobs = [];
    let offset = 0;

    while (offset < 500) {
        const url = `https://jobsearch.api.jobtechdev.se/search?occupation-field=${itField}&region=${regionId}&limit=${LIMIT}&offset=${offset}`;
        
        const res = await fetch(url, {
            headers: { "accept": "application/json" }
        });

        if (!res.ok) {
            console.error(`Fel vid hämtning för region ${regionId}: ${res.status}`);
            break;
        }

        const data = await res.json();
        const hits = data?.hits || [];

        if (hits.length === 0) break;

        regionJobs = regionJobs.concat(hits);
        offset += LIMIT;

        if (hits.length < LIMIT) break;
    }

    return regionJobs;
}

async function updateJobs() {
    try {
        console.log("Startar hämtning av IT-jobb i Södermanland och Östergötland…");

        // Region-ID från JobTech Taxonomy:
        // Södermanlands län: xS38_386_2L2
        // Östergötlands län: 4395_173_ngM
        const sodermanlandJobs = await fetchJobsForRegion("xS38_386_2L2");
        const ostergotlandJobs = await fetchJobsForRegion("4395_173_ngM");

        console.log(`Hittade ${sodermanlandJobs.length} jobb i Södermanland.`);
        console.log(`Hittade ${ostergotlandJobs.length} jobb i Östergötland.`);

        // Slå ihop jobben och ta bort eventuella dubbletter baserat på ID
        const combinedJobs = [...sodermanlandJobs, ...ostergotlandJobs];
        const uniqueJobs = Array.from(new Map(combinedJobs.map(job => [job.id, job])).values());

        console.log(`Totalt unika IT-jobb sparade: ${uniqueJobs.length}`);

        fs.writeFileSync("jobs.json", JSON.stringify(uniqueJobs, null, 2));
        console.log("jobs.json har uppdaterats framgångsrikt!");

    } catch (err) {
        console.error("Kritiskt fel i updateJobs:", err);
        fs.writeFileSync("jobs.json", JSON.stringify({ error: err.message }, null, 2));
    }
}

updateJobs();
