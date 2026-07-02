import fs from "fs";
import path from "path";

const token = "c1362dfcb0904741a1f4cfa212c12073";

async function run() {
  console.log("Fetching matches from football-data.org WC competition...");
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: {
      "X-Auth-Token": token
    }
  });

  if (!res.ok) {
    console.error("API error:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const matches = data.matches || [];
  console.log(`Successfully fetched ${matches.length} matches.`);

  // Print first 5 matches and any match that is LIVE or finished recently
  console.log("\n--- Active/Recent Matches ---");
  let activeCount = 0;
  for (const m of matches) {
    const home = m.homeTeam?.name || m.homeTeam?.tla;
    const away = m.awayTeam?.name || m.awayTeam?.tla;
    const score = `${m.score?.fullTime?.home ?? "?"} - ${m.score?.fullTime?.away ?? "?"}`;
    
    if (m.status !== "TIMED" && m.status !== "SCHEDULED") {
      console.log(`[${m.status}] ID=${m.id} | ${home} vs ${away} | Score: ${score} | Date: ${m.utcDate}`);
      activeCount++;
    }
  }

  if (activeCount === 0) {
    console.log("No active or completed matches (all are in TIMED/SCHEDULED status in the API).");
    console.log("\nHere are the first 5 scheduled matches in the API:");
    for (let i = 0; i < Math.min(5, matches.length); i++) {
      const m = matches[i];
      const home = m.homeTeam?.name || m.homeTeam?.tla;
      const away = m.awayTeam?.name || m.awayTeam?.tla;
      console.log(`[${m.status}] ID=${m.id} | ${home} vs ${away} | Date: ${m.utcDate}`);
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error("Fetch failed:", err);
  process.exit(1);
});
