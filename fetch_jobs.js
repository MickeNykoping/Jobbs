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

        // Skriv resultatet till jobs.json
        fs.writeFileSync("jobs.json", JSON.stringify(data.hits, null, 2));

        console.log("Jobb uppdaterade:", new Date().toISOString());
    } catch (err) {
        console.error("Fel vid hämtning av jobb:", err);
        process.exit(1); // Viktigt: ger tydlig exit code om något går fel
    }
}

updateJobs();
