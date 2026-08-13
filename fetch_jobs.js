import fs from "fs";

async function updateJobs() {
    try {
        const MAX_TOTAL_JOBS = 500;
        const LIMIT_PER_PAGE = 100;
        let allJobs = [];
        let offset = 0;

        // Länskoder från JobTech API:
        // Södermanlands län: xS38_386_2L2
        // Östergötlands län: 4395_173_ngM
        const sodermanland = "xS38_386_2L2";
        const ostergotland = "4395_173_ngM";
        const itField = "apaJ_22U_12F"; // Data/IT

        // RegEx för fristående "IT" (eller IT-, IT/ osv) så att det INTE matchar t.ex. "funnit"
        const strictItRegex = /\bit\b|\bit-/i;

        // Komplett lista på IT-relaterade titlar, roller och begrepp
        const validItKeywords = [
            // Utveckling & Programmering
            "utvecklare", "developer", "programmerare", "software", "mjukvara", "applikation",
            "frontend", "backend", "fullstack", "embedded", "firmware", "kodare",
            // Språk & Ramverk
            "c#", ".net", "java", "python", "c++", "php", "ruby", "rust", "golang",
            "javascript", "typescript", "react", "angular", "vue", "node", "flutter", "swift", "kotlin", "sql",
            // Support, Drift & Infrastruktur
            "it-tekniker", "supporttekniker", "servicedesk", "helpdesk", "sysadmin", "systemadministratör",
            "nätverk", "network", "drifttekniker", "infrastruktur", "infrastructure", "linux", "windows server",
            "devops", "cloud", "moln", "sre", "platform engineer",
            // Säkerhet
            "cybersäkerhet", "cybersecurity", "informationssäkerhet", "it-säkerhet", "penetration",
            "hacker", "soc", "security",
            // Data, AI & Analys
            "data engineer", "data scientist", "dataanalytiker", "bi-utvecklare", "business intelligence",
            "machine learning", "ai-utvecklare", "databas", "database", "dba",
            // Test & QA
            "testare", "tester", "testledare", "qa", "quality assurance", "automation engineer",
            // Arkitektur & Ledarskap
            "arkitekt", "architect", "scrum master", "agile coach", "product owner", "produktägare",
            "it-projektledare", "delivery manager", "it manager", "cto", "cio",
            // UX/UI & Webb
            "ux", "ui", "webbutvecklare", "webmaster", "interaction designer"
        ];

        // Ord i titeln som direkt ska kastas bort oavsett fält
        const excludedWords = [
            "kock", "måltid", "servering", "restaurang", "kök", 
            "sjuksköterska", "undersköterska", "läkare", "vård",
            "lärare", "pedagog", "förskola", "skola",
            "städare", "lokalvårdare", "sanerare",
            "butik", "säljare", "kassör",
            "chaufför", "förare", "lager", "logistik"
        ];

        console.log("Startar hämtning av IT-jobb i Södermanland och Östergötland…");

        while (allJobs.length < MAX_TOTAL_JOBS) {
            const url = `https://jobsearch.api.jobtechdev.se/search?occupational-field=${itField}&region=${sodermanland}&region=${ostergotland}&limit=${LIMIT_PER_PAGE}&offset=${offset}`;

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
            console.log(`Hämtade ${hits.length} råa träffar från API.`);

            if (hits.length === 0) break;

            // HÅRDDAGEN FILTRERING
            const strictlyFilteredJobs = hits.filter(job => {
                const title = (job.headline || "").toLowerCase();
                const fieldId = job.occupation_field?.concept_id;

                // 1. Kasta bort direkt om titeln innehåller ett exkluderat ord
                const hasExcludedWord = excludedWords.some(word => title.includes(word));
                if (hasExcludedWord) return false;

                // 2. Måste tillhöra Data/IT-fältet i grunden
                if (fieldId !== itField) return false;

                // 3. Kontrollera att titeln faktiskt innehåller antingen fristående "IT" eller ett giltigt IT-begrepp
                const hasStrictIT = strictItRegex.test(title);
                const hasValidKeyword = validItKeywords.some(keyword => title.includes(keyword));

                return hasStrictIT || hasValidKeyword;
            });

            allJobs = allJobs.concat(strictlyFilteredJobs);
            offset += LIMIT_PER_PAGE;

            if (hits.length < LIMIT_PER_PAGE) break;
        }

        console.log(`Totalt antal verifierade IT-jobb hämtade: ${allJobs.length}`);
        
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
