import fs from "fs";

async function updateJobs() {
    try {
        const MAX_TOTAL_JOBS = 500;
        const LIMIT_PER_PAGE = 100;
        let allJobs = [];
        let offset = 0;

        // Korrekta Taxonomy Concept ID:n från JobTech Dev:
        // Region Södermanland: xS38_386_2L2
        // Region Östergötland: 4395_173_ngM
        // Yrkesområde Data/IT: apaJ_2ja_LuF
        const regionSodermanland = "xS38_386_2L2";
        const regionOstergotland = "4395_173_ngM";
        const itField = "apaJ_2ja_LuF";

        console.log("Startar hämtning av IT-jobb i Södermanland och Östergötland…");

        while (allJobs.length < MAX_TOTAL_JOBS) {
            // Rätt parameter: occupation-field
            const url = `https://jobsearch.api.jobtechdev.se/search?occupation-field=${itField}&region=${regionSodermanland}&region=${regionOstergotland}&limit=${LIMIT_PER_PAGE}&offset=${offset}`;

            console.log(`Hämtar sida (offset ${offset})…`);

            const res = await fetch(url, {
                headers: { "accept": "application/json" }
            });

            if (!res.ok) {
                throw new Error(`API svarade med felkod: ${res.status}`);
            }

            const data = await res.json();
            const hits = data?.hits || [];

            console.log(`Hämtade ${hits.length} IT-jobb från API.`);

            if (hits.length === 0) break;

            allJobs = allJobs.concat(hits);
            offset += LIMIT_PER_PAGE;

            if (hits.length < LIMIT_PER_PAGE) break;
        }

        console.log(`Totalt antal IT-jobb sparade: ${allJobs.length}`);
        
        fs.writeFileSync("jobs.json", JSON.stringify(allJobs, null, 2));
        console.log("jobs.json har uppdaterats framgångsrikt!");

    } catch (err) {
        console.error("Fel vid hämtning av jobb:", err);
        fs.writeFileSync("jobs.json", JSON.stringify({ error: err.message }, null, 2));
    }
}

updateJobs();
