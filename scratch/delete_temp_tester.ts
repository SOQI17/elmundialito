import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.resolve("firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  console.log("Searching for 'Temp Tester' users in Firestore...");
  
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("name", "==", "Temp Tester"));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    console.log("No users named 'Temp Tester' found.");
    process.exit(0);
  }

  for (const userDoc of querySnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    console.log(`Found user: ${userData.name} (${userData.email}), UID: ${userId}`);

    // 1. Delete forecasts for this user
    console.log(`Finding forecasts for user ${userId}...`);
    const forecastsRef = collection(db, "forecasts");
    const qForecasts = query(forecastsRef, where("userId", "==", userId));
    const forecastsSnap = await getDocs(qForecasts);
    for (const fDoc of forecastsSnap.docs) {
      console.log(`Deleting forecast document: ${fDoc.id}`);
      await deleteDoc(doc(db, "forecasts", fDoc.id));
    }

    // 2. Find and delete league memberships
    console.log(`Finding league memberships for user ${userId}...`);
    const leaguesSnap = await getDocs(collection(db, "leagues"));
    for (const lDoc of leaguesSnap.docs) {
      const leagueCode = lDoc.id;
      const memberDocSnap = await getDocs(query(collection(db, "leagues", leagueCode, "members"), where("userId", "==", userId)));
      
      for (const mDoc of memberDocSnap.docs) {
        console.log(`Deleting membership for user ${userId} in league ${leagueCode}`);
        await deleteDoc(doc(db, "leagues", leagueCode, "members", mDoc.id));
      }
    }

    // 3. Delete user document from /users/{userId}
    console.log(`Deleting user document /users/${userId}...`);
    await deleteDoc(doc(db, "users", userId));
    console.log(`✅ Successfully deleted user ${userData.name} from Firestore.`);
  }

  console.log("All matching users processed.");
  process.exit(0);
}

run().catch(err => {
  console.error("Error running script:", err);
  process.exit(1);
});
