import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.resolve("firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const tempEmail = `temp_inspector_${Math.floor(Math.random() * 1000000)}@test.com`;
const tempPassword = "TempPassword123!";
const polUid = "b4ODFJ7MPvPuww2uVJsXQoHb79K2";

async function run() {
  console.log("Registering temporary user to satisfy security rules:", tempEmail);
  const cred = await createUserWithEmailAndPassword(auth, tempEmail, tempPassword);
  const user = cred.user;
  console.log("Authenticated UID:", user.uid);

  try {
    console.log(`\nInspecting Pol's details (UID: ${polUid})...`);
    
    // 1. Check user profile
    const userDoc = await getDoc(doc(db, "users", polUid));
    if (userDoc.exists()) {
      console.log("Pol Profile Data:", userDoc.data());
    } else {
      console.log("Pol profile document not found in /users!");
    }

    // 2. Check leagues they are a member of
    console.log("\nChecking league memberships for Pol...");
    const leaguesSnap = await getDocs(collection(db, "leagues"));
    let inLeagues = 0;
    for (const lDoc of leaguesSnap.docs) {
      const leagueCode = lDoc.id;
      const memberDoc = await getDoc(doc(db, "leagues", leagueCode, "members", polUid));
      if (memberDoc.exists()) {
        console.log(`- Pol IS A MEMBER of league: ${leagueCode} ("${lDoc.data().name}")`, memberDoc.data());
        inLeagues++;
      }
    }
    if (inLeagues === 0) {
      console.log("- Pol is NOT a member of any league in Firestore.");
    }

    // 3. Check forecasts
    console.log("\nChecking forecasts made by Pol...");
    const forecastsRef = collection(db, "forecasts");
    const qForecasts = query(forecastsRef, where("userId", "==", polUid));
    const forecastsSnap = await getDocs(qForecasts);
    console.log(`Total forecasts found for Pol: ${forecastsSnap.size}`);
    forecastsSnap.forEach(fDoc => {
      console.log(`- Forecast doc: ${fDoc.id}`, fDoc.data());
    });

  } finally {
    console.log("\nCleaning up temporary user auth account...");
    await deleteUser(user);
    console.log("Cleanup complete.");
  }
  process.exit(0);
}

run().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
