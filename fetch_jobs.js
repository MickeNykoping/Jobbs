import fs from "fs";
import fetch from "node-fetch";

async function updateJobs() {
    try {
        const url = "https://jobsearch.api.jobtechdev.se/search?q=IT&limit=200";

        console.log("Hämtar jobb från JobTech API…");

        const res = await fetch(url);

        console.log("Statuskod:", res.status);

        const text = await res.text();
        console.log("Raw API-svar:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error("Kunde inte parsa JSON från API.");
        }

        console.log("API-nycklar:", Object.keys(data));

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
