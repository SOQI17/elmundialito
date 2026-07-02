import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";
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
  console.log("Registering temp user:", email);
  let user;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
  } catch (err: any) {
    console.error("Auth error:", err);
    process.exit(1);
  }

  // Create user profile
  try {
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      name: "Temp Tester",
      avatar: "⚽",
      email: email,
      onboarded: true,
      isAdmin: false
    });
  } catch (err: any) {
    console.error("Profile creation error:", err);
    process.exit(1);
  }

  // Join league 87PWDA
  const leagueCode = "87PWDA";
  try {
    await setDoc(doc(db, "leagues", leagueCode, "members", user.uid), {
      userId: user.uid,
      leagueCode: leagueCode,
      joinedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Join league error:", err);
  }

  console.log("Fetching matches to test forecasts write...");
  const matchesSnap = await getDocs(collection(db, "matches"));
  const matches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  matches.sort((a, b) => {
    const numA = parseInt(a.id.replace("M_", ""));
    const numB = parseInt(b.id.replace("M_", ""));
    return numA - numB;
  });

  console.log(`Testing writes for ${matches.length} matches...`);
  let successCount = 0;
  let failCount = 0;

  for (const m of matches) {
    const forecastId = `${m.id}_${user.uid}_${leagueCode}`;
    try {
      await setDoc(doc(db, "forecasts", forecastId), {
        matchId: m.id,
        userId: user.uid,
        homeScore: 1,
        awayScore: 1,
        updatedAt: serverTimestamp(),
        leagueCode: leagueCode
      });
      successCount++;
    } catch (err: any) {
      console.log(`❌ Match ${m.id} failed: status=${m.status}, dateTime=${m.dateTime}. Error: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\nSummary: Success=${successCount}, Failures=${failCount}`);
  process.exit(0);
}

run();
