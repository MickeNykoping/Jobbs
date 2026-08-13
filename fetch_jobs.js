import fs from "fs";

async function updateJobs() {
    try {
        const MAX_TOTAL_JOBS = 500;
        const LIMIT_PER_PAGE = 100;
        let allJobs = [];
        let offset = 0;

        // Länskoder från JobTech API:
        // Södermanlands län: xS38_386_2L2
        // Östergötlands län: 4395_173_ngM
        const sodermanland = "xS38_386_2L2";
        const ostergotland = "4395_173_ngM";
        const itField = "apaJ_22U_12F";

        console.log("Startar hämtning av IT-jobb i Södermanland och Östergötland…");

        while (allJobs.length < MAX_TOTAL_JOBS) {
            // Söker IT-jobb i båda länen samtidigt
            const url = `https://jobsearch.api.jobtechdev.se/search?occupational-field=${itField}&region=${sodermanland}&region=${ostergotland}&limit=${LIMIT_PER_PAGE}&offset=${offset}`;

            console.log(`Hämtar sida (offset ${offset})…`);

            const res = await fetch(url, {
                headers: { "accept": "application/json" }
            });

            if (!res.ok) {
                throw new Error(`API svarade med felkod: ${res.status}`);
            }

            const text = await res.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Kunde inte parsa JSON.");
                const errorPayload = JSON.stringify({ error: "API returned non-JSON", raw: text }, null, 2);
                fs.writeFileSync("jobs.json", errorPayload || "{}");
                return;
            }

            const hits = data?.hits || [];
            console.log(`Hämtade ${hits.length} IT-jobb på denna sida.`);

            if (hits.length === 0) break;

            allJobs = allJobs.concat(hits);
            offset += LIMIT_PER_PAGE;

            if (hits.length < LIMIT_PER_PAGE) break;
        }

        console.log(`Totalt antal IT-jobb hämtade i Södermanland & Östergötland: ${allJobs.length}`);
        
        const outputData = JSON.stringify(allJobs || [], null, 2);
        fs.writeFileSync("jobs.json", outputData);
        
        console.log("jobs.json uppdaterades framgångsrikt!");

    } catch (err) {
        console.error("Fel i updateJobs:", err);
        const errorMessage = err?.message || String(err);
        const errorJson = JSON.stringify({ error: errorMessage }, null, 2);
        fs.writeFileSync("jobs.json", errorJson || '{"error": "Unknown error"}');
    }
}

updateJobs();
