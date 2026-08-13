import fs from "fs";

async function fetchFromApi(queryParams) {
    const url = `https://jobsearch.api.jobtechdev.se/search?${queryParams}`;
    console.log(`Anropar: ${url}`);
    
    try {
        const res = await fetch(url, {
            headers: {
                "accept": "application/json",
                "User-Agent": "ITJobbPortal/1.0 (GitHub Actions Runner)"
            }
        });

        if (!res.ok) {
            console.error(`HTTP Fel (${res.status}): ${url}`);
            return [];
        }

        const data = await res.json();
        return data?.hits || [];
    } catch (err) {
        console.error(`Nätverksfel vid anrop (${queryParams}):`, err.message);
        return [];
    }
}

async function updateJobs() {
    try {
        console.log("=== STARTAR HÄMTNING AV IT-JOBB ===");

        // Region-ID i JobTech Taxonomy:
        // Södermanlands län: xS38_386_2L2
        // Östergötlands län: 4395_173_ngM
        const sodermanland = "xS38_386_2L2";
        const ostergotland = "4395_173_ngM";

        let rawHits = [];

        // 1. Sök på fritext 'IT' i båda länen
        console.log("Hämtar via fritext-sökning 'IT'…");
        const soderIt = await fetchFromApi(`q=IT&region=${sodermanland}&limit=100`);
        const osterIt = await fetchFromApi(`q=IT&region=${ostergotland}&limit=100`);
        rawHits = rawHits.concat(soderIt, osterIt);

        // 2. Sök även via yrkesområde Data/IT i båda länen
        console.log("Hämtar via yrkesområde Data/IT…");
        const soderField1 = await fetchFromApi(`occupation-field=apaJ_2ja_LuF&region=${sodermanland}&limit=100`);
        const osterField1 = await fetchFromApi(`occupation-field=apaJ_2ja_LuF&region=${ostergotland}&limit=100`);
        const soderField2 = await fetchFromApi(`occupation-field=apaJ_22U_12F&region=${sodermanland}&limit=100`);
        const ostergotlandField2 = await fetchFromApi(`occupation-field=apaJ_22U_12F&region=${ostergotland}&limit=100`);
        rawHits = rawHits.concat(soderField1, osterField1, soderField2, ostergotlandField2);

        console.log(`Mottog totalt ${rawHits.length} råa träffar från alla sökningar.`);

        // Ta bort dubbletter baserat på jobb-ID
        const uniqueHitsMap = new Map();
        for (const job of rawHits) {
            if (job && job.id) {
                uniqueHitsMap.set(job.id, job);
            }
        }
        const uniqueHits = Array.from(uniqueHitsMap.values());
        console.log(`Antal unika råa jobb före filtrering: ${uniqueHits.length}`);

        // RegEx för fristående "IT" (så ord som "funnit" ELLER "kredit" INTE matchar)
        const strictItRegex = /\bit\b|\bit-/i;

        // Godkända IT-begrepp och titlar
        const validItKeywords = [
            "utvecklare", "developer", "programmerare", "software", "mjukvara", "applikation",
            "frontend", "backend", "fullstack", "embedded", "firmware", "kodare",
            "c#", ".net", "java", "python", "c++", "php", "ruby", "rust", "golang",
            "javascript", "typescript", "react", "angular", "vue", "node", "flutter", "swift", "kotlin", "sql",
            "it-tekniker", "supporttekniker", "servicedesk", "helpdesk", "sysadmin", "systemadministratör",
            "nätverk", "network", "drifttekniker", "infrastruktur", "infrastructure", "linux", "windows server",
            "devops", "cloud", "moln", "sre", "platform engineer",
            "cybersäkerhet", "cybersecurity", "informationssäkerhet", "it-säkerhet", "penetration",
            "hacker", "soc", "security",
            "data engineer", "data scientist", "dataanalytiker", "bi-utvecklare", "business intelligence",
            "machine learning", "ai-utvecklare", "databas", "database", "dba",
            "testare", "tester", "testledare", "qa", "quality assurance", "automation engineer",
            "arkitekt", "architect", "scrum master", "agile coach", "product owner", "produktägare",
            "it-projektledare", "delivery manager", "it manager", "cto", "cio",
            "ux", "ui", "webbutvecklare", "webmaster", "interaction designer"
        ];

        // Saker som absolut INTE får komma med
        const excludedWords = [
            "kock", "måltid", "servering", "restaurang", "kök",
            "sjuksköterska", "undersköterska", "läkare", "vård", "omsorg",
            "lärare", "pedagog", "förskola", "skola",
            "städare", "lokalvårdare", "sanerare",
            "butik", "säljare", "kassör",
            "chaufför", "förare", "lager", "logistik", "föräldrarådgivare"
        ];

        // HÅRDDAGEN FILTRERING
        const filteredJobs = uniqueHits.filter(job => {
            const title = (job.headline || "").toLowerCase();
            const occupation = (job.occupation?.label || "").toLowerCase();
            const fullText = `${title} ${occupation}`;

            // 1. Kasta bort direkt om icke-IT-ord finns
            const isExcluded = excludedWords.some(word => fullText.includes(word));
            if (isExcluded) return false;

            // 2. Krävs antingen fristående "IT" eller giltigt IT-nyckelord
            const hasStrictIt = strictItRegex.test(title);
            const hasValidKeyword = validItKeywords.some(keyword => fullText.includes(keyword));

            return hasStrictIt || hasValidKeyword;
        });

        console.log(`Totalt antal verifierade IT-jobb sparade: ${filteredJobs.length}`);

        fs.writeFileSync("jobs.json", JSON.stringify(filteredJobs, null, 2));
        console.log("SUCCESS: jobs.json har sparats framgångsrikt!");

    } catch (err) {
        console.error("Kritiskt fel i updateJobs:", err);
        fs.writeFileSync("jobs.json", JSON.stringify([], null, 2));
    }
}

updateJobs();
