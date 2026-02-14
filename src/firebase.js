import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAdwf2SUbr0mZBkAHX0DrJSNxjEgd7_r_8",
  authDomain: "medisync-19.firebaseapp.com",
  projectId: "medisync-19",
  storageBucket: "medisync-19.firebasestorage.app",
  messagingSenderId: "831005314747",
  appId: "1:831005314747:web:e63731bbc08a15c12b239e",
  measurementId: "G-YBM313W61F",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
