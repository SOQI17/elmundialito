import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Find firebase-applet-config.json or service account
const configPath = path.join(__dirname, '../firebase-applet-config.json');
let config;
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Initialize firebase admin
// Since we are running locally, check if we have a service account or can use application default credentials
// If no service account is found, let's look at what is available.
// Actually, let's check if we can read the matches directly from firestore.
// Let's initialize with default credentials or service account if available.
const serviceAccountPath = path.join(__dirname, '../firebase-blueprint.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  initializeApp();
}

const db = getFirestore();

async function checkKnockouts() {
  console.log('Fetching matches from Firestore...');
  const snapshot = await db.collection('matches').get();
  const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const knockouts = matches.filter(m => m.phase !== 'group');
  console.log(`Found ${knockouts.length} knockout matches in Firestore:`);
  
  knockouts.forEach(m => {
    console.log(`[${m.id}] ${m.dateTime} - Phase: ${m.phase} - Status: ${m.status}`);
    console.log(`      Home: ${m.homeTeam?.id} (${m.homeTeam?.name}) vs Away: ${m.awayTeam?.id} (${m.awayTeam?.name})`);
    console.log(`      apiId: ${m.apiId || 'None'}`);
  });
}

checkKnockouts().catch(console.error);
