import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  const targetId = "KotjP9JF3nWmVChs0pw5akIRdtU2";
  const docSnap = await getDoc(doc(db, "users", targetId));
  if (docSnap.exists()) {
    console.log(`User ${targetId} details:`, JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log(`User ${targetId} does not exist in users collection!`);
  }
  process.exit(0);
}

run();
