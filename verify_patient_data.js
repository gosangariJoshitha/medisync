import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAdwf2SUbr0mZBkAHX0DrJSNxjEgd7_r_8",
  authDomain: "medisync-19.firebaseapp.com",
  projectId: "medisync-19",
  storageBucket: "medisync-19.firebasestorage.app",
  messagingSenderId: "831005314747",
  appId: "1:831005314747:web:e63731bbc08a15c12b239e",
  measurementId: "G-YBM313W61F",
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
