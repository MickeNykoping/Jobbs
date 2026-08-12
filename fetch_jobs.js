import fs from "fs";
import fetch from "node-fetch";

async function updateJobs() {
    try {
        const url = "https://jobsearch.api.jobtechdev.se/search?q=IT&limit=200";

        console.log("Hämtar jobb från JobTech API…");

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`API-fel: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // Logga för säkerhets skull
        console.log("API-svar nycklar:", Object.keys(data));

        // JobTech API kan returnera jobben under olika nycklar:
        const jobs =
            data.hits ||
            data.results ||
            data.documents ||
            data.data ||
            [];

        if (!Array.isArray(jobs)) {
            throw new Error("API-svar innehåller inga jobb i listform.");
        }

        fs.writeFileSync("jobs.json", JSON.stringify(jobs, null, 2));

        console.log("Jobb uppdaterade:", new Date().toISOString());
    } catch (err) {
        console.error("Fel vid hämtning av jobb:", err);
        process.exit(1);
    }
}

updateJobs();
