import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[DEBUG] AuthContext State:", {
      currentUser,
      userRole,
      loading,
    });
  }, [currentUser, userRole, loading]);

  async function register(email, password, role, additionalData) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Determine collection based on role
    const collectionName =
      role === "doctor"
        ? "doctors"
        : role === "patient"
          ? "patients"
          : "caretakers";

    // Store user details in Firestore
    await setDoc(doc(db, collectionName, user.uid), {
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
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserRole(null);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        // 1. Check Doctors
        let docRef = doc(db, "doctors", user.uid);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole("doctor");
          setCurrentUser({
            ...user,
            ...docSnap.data(),
            sourceCollection: "doctors",
          });
          setLoading(false);
          return;
        }

        // 2. Check Patients (Direct ID)
        docRef = doc(db, "patients", user.uid);
        docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole("patient");
          setCurrentUser({
            ...user,
            ...docSnap.data(),
            sourceCollection: "patients",
          });
          setLoading(false);
          return;
        }

        // 3. Check Patients (Query Fallback for Legacy/Pat-ID keys)
        const q = query(
          collection(db, "patients"),
          where("uid", "==", user.uid),
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const patientDoc = querySnap.docs[0];
          setUserRole("patient");
          setCurrentUser({
            ...user,
            ...patientDoc.data(),
            id: patientDoc.id,
            sourceCollection: "patients",
          });
          setLoading(false);
          return;
        }

        // 4. Check Caretakers
        docRef = doc(db, "caretakers", user.uid);
        docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole("caretaker");
          setCurrentUser({
            ...user,
            ...docSnap.data(),
            sourceCollection: "caretakers",
          });
          setLoading(false);
          return;
        }

        // 5. Fallback Users (Legacy)
        docRef = doc(db, "users", user.uid);
        docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
          setCurrentUser({
            ...user,
            ...docSnap.data(),
            sourceCollection: "users",
          });
          setLoading(false);
          return;
        }

        // 6. Not Found
        console.error("User document not found in any collection");
        setUserRole(null);
        setCurrentUser(user); // Keep auth user even if profile is missing
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
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
