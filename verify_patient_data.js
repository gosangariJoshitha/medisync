/* eslint-env node */
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

import "dotenv/config";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkPatient() {
  const patientId = "PAT-4946";
  console.log(`Checking for patient: ${patientId}...`);

  try {
    const docRef = doc(db, "users", patientId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("Patient Email:", data.email);
      console.log("Patient Auth UID:", data.uid);
    } else {
      console.log("No such patient document!");
    }
  } catch (error) {
    console.error("Error fetching document:", error);
  }
  // Force exit after a delay to ensure everything is logged
  setTimeout(() => process.exit(0), 1000);
}

checkPatient();
