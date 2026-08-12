import fs from "fs";
import fetch from "node-fetch";

async function updateJobs() {
    try {
        const url = "https://jobsearch.api.jobtechdev.se/search?q=IT&limit=200";

        console.log("Hämtar jobb från JobTech API…");

        const res = await fetch(url);

        console.log("Statuskod:", res.status);

        const text = await res.text();
        console.log("Raw API-svar:", text.slice(0, 500)); // visa bara första 500 tecken

        if (!res.ok) {
            throw new Error(`API-svarade med felkod: ${res.status}`);
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Kunde inte parsa JSON. API-svar var inte JSON.");
            fs.writeFileSync("jobs.json", JSON.stringify({ error: "API returned non-JSON", raw: text }));
            return;
        }

        console.log("API-nycklar:", Object.keys(data));

        const jobs =
            data.hits ||
            data.results ||
            data.documents ||
            data.data ||
            [];

        console.log(`Antal jobb hittade: ${jobs.length}`);

        fs.writeFileSync("jobs.json", JSON.stringify(jobs, null, 2));
        console.log("jobs.json uppdaterad!");
    } catch (err) {
        console.error("Fel i updateJobs:", err);
        fs.writeFileSync("jobs.json", JSON.stringify({ error: err.message }));
    }
}

updateJobs();
