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
  console.log("Registering temporary user to query...");
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error("Auth error:", err);
    process.exit(1);
  }

  const andresId = "KotjP9JF3nWmVChs0pw5akIRdtU2";
  console.log(`Fetching forecasts for Andres (${andresId})...`);
  const snap = await getDocs(collection(db, "forecasts"));
  const forecasts = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(f => f.userId === andresId);

  console.log(`Found ${forecasts.length} forecasts for Andres:`);
  
  // Group by matchId
  const groups: { [matchId: string]: any[] } = {};
  forecasts.forEach(f => {
    if (!groups[f.matchId]) groups[f.matchId] = [];
    groups[f.matchId].push(f);
  });

  for (const matchId in groups) {
    if (groups[matchId].length > 1) {
      console.log(`⚠️ Match ${matchId} has MULTIPLE forecasts:`);
    } else {
      console.log(`Match ${matchId}:`);
    }
    groups[matchId].forEach(f => {
      console.log(`  - Id: ${f.id}, Score: ${f.homeScore}-${f.awayScore}, League: ${f.leagueCode}, UpdatedAt: ${f.updatedAt ? (f.updatedAt.toDate ? f.updatedAt.toDate().toISOString() : JSON.stringify(f.updatedAt)) : "null"}`);
    });
  }

  process.exit(0);
}

run();
