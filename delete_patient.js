/* eslint-env node */
import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

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

async function deletePatient() {
  const patientId = "PAT-4946";
  console.log(`Deleting corrupted patient: ${patientId}...`);

  try {
    const docRef = doc(db, "users", patientId);
    await deleteDoc(docRef);
    console.log("Document deleted successfully.");
  } catch (error) {
    console.error("Error deleting document:", error);
  }
  setTimeout(() => process.exit(0), 1000);
}

deletePatient();
