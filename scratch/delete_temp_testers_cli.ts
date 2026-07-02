import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const configPath = path.resolve("firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const tempEmail = `temp_cleanup_${Math.floor(Math.random() * 1000000)}@test.com`;
const tempPassword = "TempPassword123!";
const projectId = "elmundialito-8c928";

async function run() {
  console.log("Registering temporary user to perform database search:", tempEmail);
  const cred = await createUserWithEmailAndPassword(auth, tempEmail, tempPassword);
  const user = cred.user;
  console.log("Authenticated UID:", user.uid);

  try {
    console.log("Searching for 'Temp Tester' users in Firestore...");
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("name", "==", "Temp Tester"));
    const usersSnap = await getDocs(q);

    console.log(`Found ${usersSnap.size} user(s) matching 'Temp Tester'.`);

    for (const uDoc of usersSnap.docs) {
      const userId = uDoc.id;
      const email = uDoc.data().email;
      console.log(`\nProcessing user ${userId} (${email})...`);

      // 1. Find and delete forecasts
      console.log(`Finding forecasts for user ${userId}...`);
      const forecastsSnap = await getDocs(query(collection(db, "forecasts"), where("userId", "==", userId)));
      console.log(`Found ${forecastsSnap.size} forecast(s).`);
      for (const fDoc of forecastsSnap.docs) {
        const path = `forecasts/${fDoc.id}`;
        console.log(`Deleting Firestore path: ${path}`);
        execSync(`npx firebase-tools firestore:delete ${path} -f --project ${projectId}`, { stdio: 'inherit' });
      }

      // 2. Find and delete league memberships
      console.log(`Finding league memberships for user ${userId}...`);
      const leaguesSnap = await getDocs(collection(db, "leagues"));
      for (const lDoc of leaguesSnap.docs) {
        const leagueCode = lDoc.id;
        const memberDocRef = `leagues/${leagueCode}/members/${userId}`;
        
        // Check if member doc exists
        const memberSnap = await getDocs(query(collection(db, "leagues", leagueCode, "members"), where("userId", "==", userId)));
        if (!memberSnap.empty) {
          console.log(`Deleting Firestore path: ${memberDocRef}`);
          execSync(`npx firebase-tools firestore:delete ${memberDocRef} -f --project ${projectId}`, { stdio: 'inherit' });
        }
      }

      // 3. Delete user document and subcollections
      const userPath = `users/${userId}`;
      console.log(`Deleting Firestore path recursively: ${userPath}`);
      execSync(`npx firebase-tools firestore:delete ${userPath} -r -f --project ${projectId}`, { stdio: 'inherit' });
      console.log(`✅ User ${userId} cleanup completed.`);
    }

  } finally {
    console.log("\nCleaning up temporary search account...");
    await deleteUser(user);
    console.log("Cleanup complete.");
  }
  process.exit(0);
}

run().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
