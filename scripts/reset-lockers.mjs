import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetLockers() {
  try {
    console.log("🔄 Resetting all lockers to available...");

    const lockersSnapshot = await getDocs(collection(db, "lockers"));
    let count = 0;

    for (const docSnap of lockersSnapshot.docs) {
      await updateDoc(doc(db, "lockers", docSnap.id), {
        available: true,
      });
      console.log(`✅ Reset ${docSnap.id} to available`);
      count++;
    }

    console.log(`\n🎉 Successfully reset ${count} lockers to available!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting lockers:", error);
    process.exit(1);
  }
}

resetLockers();
