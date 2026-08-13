import fs from "fs";

async function updateJobs() {
    try {
        const MAX_TOTAL_JOBS = 500;
        const LIMIT_PER_PAGE = 100;
        let allJobs = [];
        let offset = 0;

        // Länskoder för JobTech/Arbetsförmedlingen API:
        // Södermanlands län: xS38_386_2L2
        // Östergötlands län: 4395_173_ngM
        const regionSodermanland = "xS38_386_2L2";
        const regionOstergotland = "4395_173_ngM";
        const itField = "apaJ_22U_12F"; // Data/IT

        // Lista på ord i titeln/yrket som direkt kasserar jobbet
        const excludedWords = [
            "kock", "måltid", "servering", "restaurang", "kök", 
            "sjuksköterska", "undersköterska", "läkare", "vård", "omsorg",
            "lärare", "pedagog", "förskola", "skola",
            "städare", "lokalvårdare", "sanerare",
            "butik", "säljare", "kassör",
            "chaufför", "förare", "lager", "logistik", "föräldrarådgivare"
        ];

        console.log("Startar hämtning av IT-jobb i Södermanland och Östergötland…");

        while (allJobs.length < MAX_TOTAL_JOBS) {
            // Sök IT-fältet i båda länen
            const url = `https://jobsearch.api.jobtechdev.se/search?occupational-field=${itField}&region=${regionSodermanland}&region=${regionOstergotland}&limit=${LIMIT_PER_PAGE}&offset=${offset}`;

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
                console.error("Kunde inte parsa JSON från API-svaret.");
                const errorPayload = JSON.stringify({ error: "API returned non-JSON", raw: text }, null, 2);
                fs.writeFileSync("jobs.json", errorPayload || "{}");
                return;
            }

            const hits = data?.hits || [];
            console.log(`Hämtade ${hits.length} träffar från API.`);

            if (hits.length === 0) break;

            // Rensa bort uppenbara felaktiga jobb (som kock/vård/lärare)
            const cleanJobs = hits.filter(job => {
                const title = (job.headline || "").toLowerCase();
                const occupation = (job.occupation?.label || "").toLowerCase();
                const fullText = title + " " + occupation;

                // Kasta bort om något exkluderingsord finns i titeln eller yrket
                const hasExcluded = excludedWords.some(word => fullText.includes(word));
                return !hasExcluded;
            });

            allJobs = allJobs.concat(cleanJobs);
            offset += LIMIT_PER_PAGE;

            if (hits.length < LIMIT_PER_PAGE) break;
        }

        console.log(`Totalt antal godkända IT-jobb hämtade: ${allJobs.length}`);
        
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
