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

// eslint-disable-next-line react-refresh/only-export-components
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
      if (user) {
        // Check 'doctors' collection first
        let docRef = doc(db, "doctors", user.uid);
        let docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserRole("doctor");
          setCurrentUser({ ...user, ...docSnap.data() });
        } else {
          // Check 'patients' collection
          docRef = doc(db, "patients", user.uid);
          docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserRole("patient");
            setCurrentUser({ ...user, ...docSnap.data() });
          } else {
            // Check 'caretakers' collection
            docRef = doc(db, "caretakers", user.uid);
            docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              setUserRole("caretaker");
              setCurrentUser({ ...user, ...docSnap.data() });
            } else {
              // Fallback to old 'users' collection for backward compatibility
              docRef = doc(db, "users", user.uid);
              docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                setUserRole(docSnap.data().role);
                setCurrentUser({ ...user, ...docSnap.data() });
              } else {
                console.error("User document not found in any collection");
                setUserRole(null);
              }
            }
          }
        }
      } else {
        setUserRole(null);
        setCurrentUser(null);
      }
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
