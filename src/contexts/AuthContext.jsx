import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(email, password, role, additionalData) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Store user details in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email,
      role,
      ...additionalData,
      createdAt: new Date().toISOString(),
    });

    setUserRole(role);
    return user;
  }

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    // Role will be fetched in onAuthStateChanged
    return userCredential;
  }

  function logout() {
    setUserRole(null);
    localStorage.removeItem("medisync_patient_id");
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch role from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        }
      } else {
        // Check for prototype patient session
        const localPatientId = localStorage.getItem("medisync_patient_id");
        if (localPatientId) {
          const docRef = doc(db, "users", localPatientId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const patientData = docSnap.data();
            setCurrentUser({
              uid: localPatientId,
              email: patientData.email || "patient@example.com",
              displayName: patientData.fullName,
            });
            setUserRole("patient");
            setLoading(false);
            return;
          }
        }
        setUserRole(null);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
