import { useState, useEffect } from "react";
import { User, Phone, Mail, Save, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { db } from "../../firebase";

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (currentUser) {
        // Since AuthContext already fetches data into currentUser, we can just use that!
        // But for fresh data, let's query.
        const role = currentUser.role;
        const collectionName =
          role === "doctor"
            ? "doctors"
            : role === "patient"
              ? "patients"
              : role === "caretaker"
                ? "caretakers"
                : "users";

        // Try precise collection first
        let snap = await getDoc(doc(db, collectionName, currentUser.uid));

        if (!snap.exists()) {
          // Fallback to users
          snap = await getDoc(doc(db, "users", currentUser.uid));
        }

        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            fullName: data.fullName || "",
            email: data.email || currentUser.email,
            phone: data.phone || "",
            role: data.role, // Store role for update usage
          });
        }
      }
    }
    fetchProfile();
  }, [currentUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const collectionName =
        currentUser.role === "doctor"
          ? "doctors"
          : currentUser.role === "caretaker"
            ? "caretakers"
            : "patients";
      // Note: currentUser.role comes from AuthContext, make sure it's available.
      // If not, we might need to rely on 'userRole' from context if accessible, or try-catch multiple.
      // AuthContext exposes `userRole`. Let's use `userRole` if `currentUser.role` isn't set on the object itself yet.
      // Actually `currentUser` from AuthContext in step 1221 DOES include `...docSnap.data()`, so it HAS `role`.

      const targetCollection =
        profile.role === "doctor"
          ? "doctors"
          : profile.role === "caretaker"
            ? "caretakers"
            : profile.role === "patient"
              ? "patients"
              : "users";

      try {
        await updateDoc(doc(db, targetCollection, currentUser.uid), {
          fullName: profile.fullName,
          phone: profile.phone,
        });
      } catch (e) {
        // Fallback to legacy 'users'
        await updateDoc(doc(db, "users", currentUser.uid), {
          fullName: profile.fullName,
          phone: profile.phone,
        });
      }
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const [newPassword, setNewPassword] = useState("");

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    try {
      await updatePassword(currentUser, newPassword);
      alert("Password updated successfully!");
      setNewPassword("");
    } catch (error) {
      console.error(error);
      alert("Failed to update password: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <User /> Account Settings
      </h1>

      <div className="card mb-6">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="form-group">
            <label className="label">Full Name</label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className="input pl-10"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={profile.email}
                className="input pl-10 bg-gray-50"
                disabled
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="input pl-10"
                placeholder="+1 234..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save size={18} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          Change Password
        </h3>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="form-group">
            <label className="label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder="Enter new password"
              minLength={6}
              required
            />
          </div>
          <div className="flex justify-end">
            <button disabled={loading} className="btn btn-outline">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      <button
        onClick={logout}
        className="btn w-full bg-red-50 text-red-600 hover:bg-red-100 border-red-200 flex items-center justify-center gap-2"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
