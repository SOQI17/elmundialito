import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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

  // Create user profile
  console.log(`Creating user profile in /users/${user.uid}...`);
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

  // Join league 87PWDA
  const leagueCode = "87PWDA";
  console.log(`Joining league ${leagueCode}...`);
  try {
    await setDoc(doc(db, "leagues", leagueCode, "members", user.uid), {
      userId: user.uid,
      leagueCode: leagueCode,
      joinedAt: new Date().toISOString()
    });
    console.log("✅ Joined league successfully!");
  } catch (err: any) {
    console.error("❌ Joining league failed:", err.message);
  }

  // Write forecast for M_3 (Andres has forecast for M_3)
  const matchId = "M_3";
  const forecastId = `${matchId}_${user.uid}_${leagueCode}`;

  console.log(`\nTesting forecast write to ${forecastId} for match ${matchId} in league ${leagueCode}...`);
  try {
    await setDoc(doc(db, "forecasts", forecastId), {
      matchId,
      userId: user.uid,
      homeScore: 2,
      awayScore: 1,
      updatedAt: serverTimestamp(),
      leagueCode: leagueCode
    });
    console.log("✅ SUCCESS: The forecast write went through!");
  } catch (err: any) {
    console.error("❌ FAILURE: Firestore rejected the forecast write:", err.message);
  }

  // Let's check status of match M_3
  const matchSnap = await getDoc(doc(db, "matches", matchId));
  if (matchSnap.exists()) {
    console.log("Match M_3 details:", matchSnap.data());
  } else {
    console.log("Match M_3 not found.");
  }

  process.exit(0);
}

run();
