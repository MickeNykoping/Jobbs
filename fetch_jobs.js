import fs from "fs";

async function fetchJobsForRegion(regionId, regionName) {
    const itField = "apaJ_2ja_LuF"; // Data/IT taxonomy ID
    const LIMIT = 100;
    let regionJobs = [];
    let offset = 0;

    console.log(`--- Startar hämtning för ${regionName} (${regionId}) ---`);

    while (offset < 500) {
        const url = `https://jobsearch.api.jobtechdev.se/search?occupation-field=${itField}&region=${regionId}&limit=${LIMIT}&offset=${offset}`;
        
        try {
            let res = await fetch(url, {
                headers: { 
                    "accept": "application/json",
                    "User-Agent": "ITJobbPortal/1.0 (GitHub Actions Runner)"
                }
            });

            if (!res.ok) {
                console.error(`HTTP Fel (${regionName}): ${res.status}`);
                break;
            }

            let data = await res.json();
            let hits = data?.hits || [];

            // Om yrkesområdeskoden ger 0 träffar, gör en reservsökning på fritext "IT"
            if (offset === 0 && hits.length === 0) {
                console.log(`Inga träffar med yrkesområde. Provar reservsökning på 'IT' i ${regionName}…`);
                const fallbackUrl = `https://jobsearch.api.jobtechdev.se/search?q=IT&region=${regionId}&limit=${LIMIT}&offset=${offset}`;
                const fallbackRes = await fetch(fallbackUrl, {
                    headers: { 
                        "accept": "application/json",
                        "User-Agent": "ITJobbPortal/1.0 (GitHub Actions Runner)"
                    }
                });
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    hits = fallbackData?.hits || [];
                }
            }

            console.log(`Hittade ${hits.length} jobb för ${regionName} (offset ${offset}).`);

            if (hits.length === 0) break;

            regionJobs = regionJobs.concat(hits);
            offset += LIMIT;

            if (hits.length < LIMIT) break;
        } catch (fetchErr) {
            console.error(`Nätverksfel för ${regionName}:`, fetchErr);
            break;
        }
    }

    return regionJobs;
}

async function updateJobs() {
    try {
        console.log("=== HÄMTAR IT-JOBB SÖDERMANLAND & ÖSTERGÖTLAND ===");

        // Södermanlands län: xS38_386_2L2
        // Östergötlands län: 4395_173_ngM
        const sodermanlandJobs = await fetchJobsForRegion("xS38_386_2L2", "Södermanlands län");
        const ostergotlandJobs = await fetchJobsForRegion("4395_173_ngM", "Östergötlands län");

        console.log(`Antal i Södermanland: ${sodermanlandJobs.length}`);
        console.log(`Antal i Östergötland: ${ostergotlandJobs.length}`);

        const combinedJobs = [...sodermanlandJobs, ...ostergotlandJobs];
        const uniqueJobs = Array.from(new Map(combinedJobs.map(job => [job.id, job])).values());

        console.log(`Totalt unika IT-jobb: ${uniqueJobs.length}`);

        fs.writeFileSync("jobs.json", JSON.stringify(uniqueJobs, null, 2));
        console.log("jobs.json sparades framgångsrikt!");

    } catch (err) {
        console.error("Fel vid hämtning:", err);
        fs.writeFileSync("jobs.json", JSON.stringify([], null, 2));
    }
}

updateJobs();
