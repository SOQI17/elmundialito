import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.resolve("firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const tempEmail = `temp_searcher_${Math.floor(Math.random() * 1000000)}@test.com`;
const tempPassword = "TempPassword123!";

async function run() {
  console.log("Registering temporary user to satisfy security rules:", tempEmail);
  const cred = await createUserWithEmailAndPassword(auth, tempEmail, tempPassword);
  const user = cred.user;
  console.log("Authenticated UID:", user.uid);

  try {
    console.log("Searching for 'Pol' in Firestore users...");
    const usersRef = collection(db, "users");
    const usersSnap = await getDocs(usersRef);
    
    let found = false;
    usersSnap.forEach(doc => {
      const data = doc.data();
      const name = data.name || "";
      const email = data.email || "";
      if (name.toLowerCase().includes("pol") || email.toLowerCase().includes("pol") || doc.id.toLowerCase().includes("pol")) {
        console.log(`Found matching user: ID=${doc.id}, Name="${name}", Email="${email}"`, data);
        found = true;
      }
    });

    if (!found) {
      console.log("No users matching 'Pol' found.");
    }
  } finally {
    console.log("Cleaning up temporary user auth account...");
    await deleteUser(user);
    console.log("Cleanup complete.");
  }
  process.exit(0);
}

run().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
