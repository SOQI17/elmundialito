/**
 * Helper to perform synchronization of matches from football-data.org to Firestore.
 * 
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} apiToken
 * @returns {Promise<{ updatedCount: number, matchesSynced: number }>}
 */
export async function performSync(db, apiToken) {
  if (!apiToken) {
    throw new Error("Missing apiToken for football-data.org");
  }

  // 1. Fetch matches from the API
  console.log("Fetching matches from football-data.org API...");
  const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: {
      "X-Auth-Token": apiToken
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (status ${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const apiMatches = data.matches || [];
  console.log(`Fetched ${apiMatches.length} matches from API.`);

  // 2. Fetch local matches from Firestore
  const matchesSnapshot = await db.collection("matches").get();
  const localMatches = matchesSnapshot.docs.map(doc => ({
    id: doc.id,
    ref: doc.ref,
    ...doc.data()
  }));
  console.log(`Fetched ${localMatches.length} local matches from Firestore.`);

  let updatedCount = 0;
  const batch = db.batch();

  // Helper for fuzzy name matching
  const normalizeName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]/g, "") // remove special chars/spaces
      .replace("republicacheca", "czechia")
      .replace("repocheca", "czechia")
      .replace("sudafrica", "southafrica")
      .replace("coreadelsur", "southkorea");
  };

  // 3. Match and compare
  for (const apiM of apiMatches) {
    // Determine target local status from API status
    // API Statuses: SCHEDULED, TIMED, LIVE, IN_PLAY, PAUSED, FINISHED, POSTPONED, SUSPENDED, CANCELLED
    let targetStatus = "scheduled";
    if (apiM.status === "FINISHED" || apiM.status === "FINISHED_OR_AWARDED" || apiM.status === "AWARDED") {
      targetStatus = "finished";
    } else if (apiM.status === "IN_PLAY" || apiM.status === "PAUSED" || apiM.status === "LIVE") {
      targetStatus = "live";
    }

    // Try to find matching local match
    // Check 1: Match by apiId
    let localMatch = localMatches.find(m => m.apiId === apiM.id);

    // Check 2: Match by TLA codes & Date (with tolerance of 24 hours)
    if (!localMatch) {
      const apiHomeTla = apiM.homeTeam?.tla;
      const apiAwayTla = apiM.awayTeam?.tla;
      const apiTime = new Date(apiM.utcDate).getTime();

      localMatch = localMatches.find(m => {
        const localHomeId = m.homeTeam?.id;
        const localAwayId = m.awayTeam?.id;
        const localTime = new Date(m.dateTime).getTime();
        const timeDiffHours = Math.abs(apiTime - localTime) / (1000 * 60 * 60);

        // Check TLA alignment and date proximity (within 24 hours)
        return localHomeId === apiHomeTla && localAwayId === apiAwayTla && timeDiffHours <= 24;
      });
    }

    // Check 3: Match by names & Date (with tolerance of 24 hours)
    if (!localMatch) {
      const apiHomeNorm = normalizeName(apiM.homeTeam?.name || apiM.homeTeam?.shortName);
      const apiAwayNorm = normalizeName(apiM.awayTeam?.name || apiM.awayTeam?.shortName);
      const apiTime = new Date(apiM.utcDate).getTime();

      localMatch = localMatches.find(m => {
        const localHomeNorm = normalizeName(m.homeTeam?.name);
        const localAwayNorm = normalizeName(m.awayTeam?.name);
        const localTime = new Date(m.dateTime).getTime();
        const timeDiffHours = Math.abs(apiTime - localTime) / (1000 * 60 * 60);

        return localHomeNorm === apiHomeNorm && localAwayNorm === apiAwayNorm && timeDiffHours <= 24;
      });
    }

    if (!localMatch) {
      // No match found in our local schedule, skip
      continue;
    }

    // Prepare update data
    const updateData = {};
    let needsUpdate = false;

    // Check status
    if (localMatch.status !== targetStatus) {
      updateData.status = targetStatus;
      needsUpdate = true;
    }

    // Check scores (only write if present/non-null in the API)
    const apiHomeScore = apiM.score?.fullTime?.home;
    const apiAwayScore = apiM.score?.fullTime?.away;

    if (targetStatus === "live" || targetStatus === "finished") {
      if (apiHomeScore !== null && apiHomeScore !== undefined) {
        const apiHomeScoreNum = Number(apiHomeScore);
        if (localMatch.homeScore !== apiHomeScoreNum) {
          updateData.homeScore = apiHomeScoreNum;
          needsUpdate = true;
        }
      }
      if (apiAwayScore !== null && apiAwayScore !== undefined) {
        const apiAwayScoreNum = Number(apiAwayScore);
        if (localMatch.awayScore !== apiAwayScoreNum) {
          updateData.awayScore = apiAwayScoreNum;
          needsUpdate = true;
        }
      }
    }

    // Check apiId association
    if (!localMatch.apiId || localMatch.apiId !== apiM.id) {
      updateData.apiId = apiM.id;
      needsUpdate = true;
    }

    if (needsUpdate) {
      batch.update(localMatch.ref, updateData);
      updatedCount++;
      console.log(`Match ${localMatch.id} needs update:`, updateData);
    }
  }

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`Successfully committed batch updates for ${updatedCount} matches.`);
  } else {
    console.log("No updates needed.");
  }

  return {
    updatedCount,
    matchesSynced: apiMatches.length
  };
}
