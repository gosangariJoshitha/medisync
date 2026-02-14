import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseConfig } from "./src/firebase"; // Adjust path if needed

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
      console.log("Patient Document Found:");
      console.log(JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log("No such patient document!");
    }
  } catch (error) {
    console.error("Error fetching document:", error);
  }
  process.exit();
}

checkPatient();
