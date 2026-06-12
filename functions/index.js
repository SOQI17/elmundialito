import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { performSync } from "./syncHelper.js";

initializeApp();
const db = getFirestore();

// Define secret parameter
const footballDataToken = defineSecret("FOOTBALL_DATA_TOKEN");

// Helper to check admin authorization
async function checkIsAdmin(auth, db) {
  if (!auth) return false;
  
  const callerEmail = auth.token?.email;
  const callerUid = auth.uid;

  // 1. Check email whitelist
  const authorizedEmails = ["alexisguerra9577@gmail.com", "alexis.guerra@orimec.com.ec"];
  if (callerEmail && authorizedEmails.includes(callerEmail)) {
    return true;
  }

  // 2. Check users/{uid} document in Firestore
  try {
    const userDoc = await db.collection("users").doc(callerUid).get();
    if (userDoc.exists && userDoc.data().isAdmin === true) {
      return true;
    }
  } catch (err) {
    console.error("Error checking admin status in Firestore:", err);
  }

  return false;
}

/**
 * Callable Function: syncMatches
 * Triggers manual synchronization. Accessible only by admins.
 */
export const syncMatches = onCall({ secrets: [footballDataToken], region: "us-central1" }, async (request) => {
  const isAuthorized = await checkIsAdmin(request.auth, db);
  if (!isAuthorized) {
    throw new HttpsError("permission-denied", "Acceso denegado. Solo administradores pueden sincronizar resultados.");
  }

  try {
    const apiToken = footballDataToken.value();
    const result = await performSync(db, apiToken);
    return {
      success: true,
      message: `Sincronización completada con éxito. ${result.updatedCount} partidos actualizados de ${result.matchesSynced} procesados.`,
      updatedCount: result.updatedCount
    };
  } catch (err) {
    console.error("Error inside syncMatches callable function:", err);
    throw new HttpsError("internal", err.message || "Error interno al sincronizar partidos.");
  }
});

/**
 * Scheduled Function: autoSyncMatches
 * Automatically synchronizes matches every 10 minutes, optimizing API calls.
 */
export const autoSyncMatches = onSchedule({
  schedule: "every 10 minutes",
  secrets: [footballDataToken],
  region: "us-central1",
  timeZone: "America/Bogota" // Use Colombia/Ecuador timezone matching local user time
}, async (event) => {
  console.log("Checking if autoSyncMatches execution is required...");
  
  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

  // 1. Check if there are any matches with status "live"
  const liveSnapshot = await db.collection("matches")
    .where("status", "==", "live")
    .limit(1)
    .get();

  const hasLiveMatches = !liveSnapshot.empty;

  // 2. Check if there are any matches with status "scheduled" whose start time is in the past,
  // up to 4 hours ago (meaning they should be live or finishing right now)
  const scheduledSnapshot = await db.collection("matches")
    .where("status", "==", "scheduled")
    .get();

  const hasRecentScheduled = scheduledSnapshot.docs.some(doc => {
    const data = doc.data();
    if (!data.dateTime) return false;
    const matchTime = new Date(data.dateTime);
    // dateTime is between 4 hours ago and now
    return matchTime >= fourHoursAgo && matchTime <= now;
  });

  if (!hasLiveMatches && !hasRecentScheduled) {
    console.log("No live matches and no scheduled matches starting in the last 4 hours. Skipping sync to save API quota.");
    return null;
  }

  console.log(`AutoSync condition met: liveMatches=${hasLiveMatches}, recentScheduledMatches=${hasRecentScheduled}. Starting sync...`);

  try {
    const apiToken = footballDataToken.value();
    const result = await performSync(db, apiToken);
    console.log(`AutoSync complete. Updated ${result.updatedCount} matches.`);
    return null;
  } catch (err) {
    console.error("Error during autoSyncMatches execution:", err);
    return null;
  }
});
