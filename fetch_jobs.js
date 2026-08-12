import fs from "fs";

async function updateJobs() {
    try {
        const MAX_TOTAL_JOBS = 500;
        const LIMIT_PER_PAGE = 100;
        let allJobs = [];
        let offset = 0;

        console.log("Startar hämtning av IT-jobb från JobTech API…");

        while (allJobs.length < MAX_TOTAL_JOBS) {
            const url = `https://jobsearch.api.jobtechdev.se/search?occupational-field=apaJ_22U_12F&limit=${LIMIT_PER_PAGE}&offset=${offset}`;

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
                // Säkra upp så att det som skrivs alltid är en giltig sträng!
                const errorPayload = JSON.stringify({ error: "API returned non-JSON", raw: text }, null, 2);
                fs.writeFileSync("jobs.json", errorPayload || "{}");
                return;
            }

            const hits = data?.hits || [];
            console.log(`Hämtade ${hits.length} jobb på denna sida.`);

            if (hits.length === 0) break;

            allJobs = allJobs.concat(hits);
            offset += LIMIT_PER_PAGE;

            if (hits.length < LIMIT_PER_PAGE) break;
        }

        console.log(`Totalt antal IT-jobb hämtade: ${allJobs.length}`);
        
        // VÄSENTLIG FIX: Om allJobs av någon anledning skulle vara undefined/tom, skriv "[]"
        const outputData = JSON.stringify(allJobs || [], null, 2);
        fs.writeFileSync("jobs.json", outputData);
        
        console.log("jobs.json uppdaterades framgångsrikt!");

    } catch (err) {
        console.error("Fel i updateJobs:", err);
        const errorMessage = err?.message || String(err);
        
        // VÄSENTLIG FIX: Säkerställ att felobjektet konverteras korrekt
        const errorJson = JSON.stringify({ error: errorMessage }, null, 2);
        fs.writeFileSync("jobs.json", errorJson || '{"error": "Unknown error"}');
    }
}

updateJobs();
