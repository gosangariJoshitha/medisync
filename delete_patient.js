import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

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
