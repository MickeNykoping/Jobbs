import fs from "fs";

async function updateJobs() {
    try {
        const url = "https://jobsearch.api.jobtechdev.se/search?q=IT&limit=200";

        console.log("Hämtar jobb från JobTech API…");

        // Inbyggd fetch i Node 18+
        const res = await fetch(url, {
            headers: {
                "accept": "application/json"
            }
        });

        console.log("Statuskod:", res.status);

        const text = await res.text();
        console.log("Raw API-svar (första 500 tecken):", text.slice(0, 500));

        if (!res.ok) {
            throw new Error(`API svarade med felkod: ${res.status}`);
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Kunde inte parsa JSON.");
            fs.writeFileSync(
                "jobs.json", 
                JSON.stringify({ error: "API returned non-JSON", raw: text }, null, 2)
            );
            return;
        }

        // JobTech API returnerar träffarna under .hits
        const jobs = data?.hits || data?.results || data?.documents || data?.data || [];

        console.log(`Antal jobb hittade: ${jobs.length}`);

        // Garanterar att jobs är en array/objekt innan stringify
        fs.writeFileSync("jobs.json", JSON.stringify(jobs, null, 2));
        console.log("jobs.json uppdaterad!");
    } catch (err) {
        console.error("Fel i updateJobs:", err);
        const errorMessage = err?.message || String(err);
        fs.writeFileSync("jobs.json", JSON.stringify({ error: errorMessage }, null, 2));
    }
}

updateJobs();
