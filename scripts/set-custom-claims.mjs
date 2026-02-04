import fs from "node:fs";
import process from "node:process";
import admin from "firebase-admin";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const uid = process.env.TARGET_UID;
const role = process.env.TARGET_ROLE;

if (!serviceAccountPath || !uid || !role) {
  console.error("Missing env. Use FIREBASE_SERVICE_ACCOUNT_PATH, TARGET_UID, TARGET_ROLE");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

await admin.auth().setCustomUserClaims(uid, { role });
console.log(`Updated custom claims for ${uid} -> role=${role}`);
process.exit(0);
