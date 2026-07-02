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
  console.log("Signing in...");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  console.log("Searching for users with name 'andres'...");
  const usersSnap = await getDocs(collection(db, "users"));
  const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const andresUsers = users.filter((u: any) => 
    u.name && u.name.toLowerCase().includes("andres")
  );

  console.log(`Found ${andresUsers.length} matching users:`);
  console.log(JSON.stringify(andresUsers, null, 2));

  if (andresUsers.length === 0) {
    console.log("No user named Andres found. Here are first 20 users in system:");
    console.log(JSON.stringify(users.slice(0, 20), null, 2));
    process.exit(0);
  }

  // Fetch all forecasts for these users
  const forecastsSnap = await getDocs(collection(db, "forecasts"));
  const forecasts = forecastsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  for (const andres of andresUsers) {
    const andresForecasts = forecasts.filter((f: any) => f.userId === andres.id);
    console.log(`\nForecasts for user '${andres.name}' (${andres.id}) count: ${andresForecasts.length}`);
    andresForecasts.forEach((f: any) => {
      console.log(` - DocId: ${f.id}, MatchId: ${f.matchId}, League: ${f.leagueCode}, predicted: ${f.homeScore}-${f.awayScore}, updatedAt: ${JSON.stringify(f.updatedAt)}`);
    });
  }

  process.exit(0);
}

run();
