import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.resolve("firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const email = "temp_tester_" + Math.floor(Math.random() * 1000000) + "@test.com";
const password = "TemporaryPassword123!";

async function run() {
  console.log("Registering temporary user:", email);
  let user;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
    console.log("✅ Registered successfully. UID:", user.uid);
  } catch (err: any) {
    console.error("❌ Auth Error:", err);
    process.exit(1);
  }

  // Step 2: Create user profile
  console.log(`\nCreating user profile in /users/${user.uid}...`);
  try {
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      name: "Temp Tester",
      avatar: "⚽",
      email: email,
      onboarded: true,
      isAdmin: false
    });
    console.log("✅ User profile created successfully!");
  } catch (err: any) {
    console.error("❌ Profile creation failed:", err.message);
    process.exit(1);
  }

  // Step 3: Write forecast
  const matchId = "M_10";
  const forecastId = `${matchId}_${user.uid}`;

  console.log(`\nTesting forecast write to ${forecastId} for match ${matchId}...`);
  try {
    await setDoc(doc(db, "forecasts", forecastId), {
      matchId,
      userId: user.uid,
      homeScore: 1,
      awayScore: 2,
      updatedAt: serverTimestamp(),
      leagueCode: null
    });
    console.log("✅ SUCCESS: The forecast write went through!");
  } catch (err: any) {
    console.error("❌ FAILURE: Firestore rejected the forecast write:", err.message);
  }
  process.exit(0);
}

run();
