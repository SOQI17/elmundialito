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
  console.log("Registering temporary user to query forecasts...");
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error("Auth error:", err);
    process.exit(1);
  }

  console.log("Fetching all forecasts...");
  const snap = await getDocs(collection(db, "forecasts"));
  const forecasts = snap.docs.map(d => {
    const data = d.data();
    let updatedDate = null;
    if (data.updatedAt) {
      if (typeof data.updatedAt.toDate === "function") {
        updatedDate = data.updatedAt.toDate();
      } else if (data.updatedAt.seconds) {
        updatedDate = new Date(data.updatedAt.seconds * 1000);
      } else {
        updatedDate = new Date(data.updatedAt);
      }
    }
    return {
      id: d.id,
      matchId: data.matchId,
      userId: data.userId,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      leagueCode: data.leagueCode,
      updatedAt: updatedDate
    };
  });

  // Sort by updatedAt descending
  forecasts.sort((a, b) => {
    const timeA = a.updatedAt ? a.updatedAt.getTime() : 0;
    const timeB = b.updatedAt ? b.updatedAt.getTime() : 0;
    return timeB - timeA;
  });

  console.log("\n20 Most Recently Updated Forecasts:");
  forecasts.slice(0, 20).forEach(f => {
    console.log(`- Id: ${f.id}`);
    console.log(`  User: ${f.userId}`);
    console.log(`  Score: ${f.homeScore} - ${f.awayScore}`);
    console.log(`  League: ${f.leagueCode}`);
    console.log(`  UpdatedAt: ${f.updatedAt ? f.updatedAt.toISOString() : "null"}`);
  });

  process.exit(0);
}

run();
