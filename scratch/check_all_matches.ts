import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ Registered successfully.");
  } catch (err: any) {
    console.error("❌ Auth Error:", err);
    process.exit(1);
  }

  console.log("Fetching matches from Firestore...");
  const snap = await getDocs(collection(db, "matches"));
  const matches = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  // Sort matches by id numerically (e.g. M_1, M_2, M_10...)
  matches.sort((a, b) => {
    const numA = parseInt(a.id.replace("M_", ""));
    const numB = parseInt(b.id.replace("M_", ""));
    return numA - numB;
  });

  const now = new Date();
  console.log(`Total matches in Firestore: ${matches.length}`);
  console.log("Matches that are scheduled but start time has passed (locked on client):");
  
  let countLocked = 0;
  for (const m of matches) {
    const matchTime = new Date(m.dateTime);
    const isPast = now.getTime() >= matchTime.getTime();
    if (m.status === "scheduled" && isPast) {
      console.log(` - ID: ${m.id}, Teams: ${m.homeTeam?.name} vs ${m.awayTeam?.name}, DateTime: ${m.dateTime}, Status: ${m.status} (PAST)`);
      countLocked++;
    }
  }
  console.log(`Matches scheduled but past: ${countLocked}`);

  console.log("\nMatches that are live or finished:");
  for (const m of matches) {
    if (m.status !== "scheduled") {
      console.log(` - ID: ${m.id}, Teams: ${m.homeTeam?.name} vs ${m.awayTeam?.name}, DateTime: ${m.dateTime}, Status: ${m.status}`);
    }
  }

  process.exit(0);
}

run();
