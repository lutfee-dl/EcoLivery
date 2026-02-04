import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";

// Firebase config - ใช้ค่าจาก .env.local
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

async function seedData() {
  try {
    console.log("🌱 Starting to seed Firebase data...");

    // 1. สร้าง Lockers
    console.log("📦 Creating lockers...");
    const lockers = [
      // ชั้น 1 - Zone A
      { id: "A-01", name: "Locker A-01", location: "ชั้น 1 โซน A", size: "S", available: true },
      { id: "A-02", name: "Locker A-02", location: "ชั้น 1 โซน A", size: "M", available: true },
      { id: "A-03", name: "Locker A-03", location: "ชั้น 1 โซน A", size: "L", available: true },
      // ชั้น 1 - Zone B
      { id: "B-01", name: "Locker B-01", location: "ชั้น 1 โซน B", size: "M", available: true },
      { id: "B-02", name: "Locker B-02", location: "ชั้น 1 โซน B", size: "XL", available: true },
      // ชั้น 2 - Zone C
      { id: "C-01", name: "Locker C-01", location: "ชั้น 2 โซน C", size: "S", available: true },
      { id: "C-02", name: "Locker C-02", location: "ชั้น 2 โซน C", size: "L", available: true },
      // ชั้น 2 - Zone D
      { id: "D-01", name: "Locker D-01", location: "ชั้น 2 โซน D", size: "M", available: true },
      { id: "D-02", name: "Locker D-02", location: "ชั้น 2 โซน D", size: "XL", available: true },
      // ชั้น 3 - Zone E
      { id: "E-01", name: "Locker E-01", location: "ชั้น 3 โซน E", size: "S", available: true },
    ];

    for (const locker of lockers) {
      await setDoc(doc(db, "lockers", locker.id), {
        ...locker,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Created locker: ${locker.name}`);
    }

    // 2. สร้าง Sample Activity Log
    console.log("📝 Creating sample activity log...");
    await addDoc(collection(db, "activity_logs"), {
      userId: "system",
      userEmail: "system@ecolivery.com",
      userRole: "system",
      category: "system",
      action: "database_seeded",
      level: "success",
      details: {
        message: "Initial database seeding completed",
        lockersCreated: lockers.length,
      },
      metadata: {},
      timestamp: serverTimestamp(),
    });
    console.log("✅ Created sample activity log");

    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Lockers: ${lockers.length} (all available)`);
    console.log(`   - Activity Logs: 1`);
    console.log("\n💡 Locker IDs created:");
    lockers.forEach(l => console.log(`   - ${l.id}: ${l.name} (${l.size})`));
    console.log("\n📍 Next steps:");
    console.log("   1. Go to Firebase Console → Firestore Database");
    console.log("   2. You should see collections: lockers, activity_logs");
    console.log("   3. Run your Next.js app: npm run dev");
    console.log("   4. Login and test the system");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
