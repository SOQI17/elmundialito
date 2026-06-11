import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  console.log("Checking matches in Firestore...");
  const matchesSnap = await getDocs(collection(db, "matches"));
  const matches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("Matches:", JSON.stringify(matches, null, 2));

  console.log("\nChecking forecasts in Firestore...");
  const forecastsSnap = await getDocs(collection(db, "forecasts"));
  console.log(`Found ${forecastsSnap.size} forecasts.`);
  if (forecastsSnap.size > 0) {
    const sample = forecastsSnap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() }));
    console.log("Sample forecasts:", JSON.stringify(sample, null, 2));
  }
}

check().catch(console.error);
