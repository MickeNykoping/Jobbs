import fs from "fs";
import fetch from "node-fetch";

async function updateJobs() {
    const url = "https://jobsearch.api.jobtechdev.se/search?q=IT&limit=200";
    const res = await fetch(url);
    const data = await res.json();

    fs.writeFileSync("jobs.json", JSON.stringify(data.hits, null, 2));
    console.log("Jobb uppdaterade:", new Date());
}

updateJobs();
