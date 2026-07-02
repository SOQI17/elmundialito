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

  console.log("Querying all users...");
  const snap = await getDocs(collection(db, "users"));
  const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  console.log("Total users in system:", users.length);
  const andresUsers = users.filter(u => u.name && u.name.toLowerCase().includes("andres"));
  console.log("Users containing 'andres':");
  console.log(JSON.stringify(andresUsers, null, 2));

  process.exit(0);
}

run();
