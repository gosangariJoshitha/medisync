import { useState, useEffect } from "react";
import {
  Link2,
  Save,
  LogOut,
  User,
  Phone as PhoneIcon,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const [doctorId, setDoctorId] = useState("");
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [caretaker, setCaretaker] = useState(null); // { uid, name }
  const [patientId, setPatientId] = useState("");
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (currentUser) {
        const collectionName = currentUser.sourceCollection || "users";
        const snap = await getDoc(doc(db, collectionName, currentUser.uid));
        if (snap.exists() && snap.data().doctorUid) {
          setCurrentDoctor(snap.data().doctorUid);
        }
        if (snap.exists()) {
          const data = snap.data();
          setPatientId(data.patientId || "Generating...");
          if (data.caretakerUid) {
            setCaretaker({ uid: data.caretakerUid, name: data.caretakerName });
          }
          setProfile({
            fullName: data.fullName || "",
            email: data.email || currentUser.email,
            phone: data.phone || "",
            age: data.age || "",
            gender: data.gender || "",
          });
        }
      }
    }
    fetchData();
  }, [currentUser]);

  const handleLink = async (e) => {
    e.preventDefault();
    // In real app, verify doctor ID first
    try {
      const collectionName = currentUser.sourceCollection || "users";
      await updateDoc(doc(db, collectionName, currentUser.uid), {
        doctorUid: doctorId,
        role: "patient", // Ensure role
        riskStatus: "stable", // Default
      });
      setCurrentDoctor(doctorId);
      alert("Successfully linked to Doctor!");
    } catch (error) {
      console.error(error);
      alert("Failed to link.");
    }
  };

  const handleUnlinkCaretaker = async () => {
    if (
      !window.confirm(
        "Are you sure you want to remove your caretaker? They will no longer be able to monitor your health.",
      )
    )
      return;
    setLoading(true);
    try {
      const collectionName = currentUser.sourceCollection || "users";
      await updateDoc(doc(db, collectionName, currentUser.uid), {
        caretakerUid: null,
        caretakerName: null,
      });
      setCaretaker(null);
      alert("Caretaker unlinked successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to unlink caretaker.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const collectionName = currentUser.sourceCollection || "users";
      await updateDoc(doc(db, collectionName, currentUser.uid), {
        fullName: profile.fullName,
        phone: profile.phone,
        age: profile.age,
        gender: profile.gender,
      });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

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
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="card mb-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <User size={20} className="text-primary" /> Personal Profile
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Email (Read-only)</label>
              <input
                value={profile.email}
                className="input bg-gray-50"
                disabled
              />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="input"
                placeholder="+1 234..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Age</label>
                <input
                  name="age"
                  type="number"
                  value={profile.age}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="label">Gender</label>
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button disabled={loading} className="btn btn-primary">
              {loading ? "Saving..." : "Save Profile"}
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

      <div className="card mb-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <User size={20} className="text-primary" /> Caretaker Connection
        </h3>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
          <p className="text-sm text-blue-800 mb-1 font-semibold">
            Your Patient ID
          </p>
          <p className="text-2xl font-bold text-blue-900 tracking-wider">
            {patientId}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Share this ID with a caretaker (family member or nurse) so they can
            link to your account and monitor your health.
          </p>
        </div>

        {caretaker ? (
          <div className="bg-green-50 text-green-800 p-4 rounded border border-green-200 flex justify-between items-center">
            <div>
              <strong>Linked Caretaker:</strong> {caretaker.name || "Unknown"}
              <p className="text-sm mt-1">Currently monitoring your stats.</p>
            </div>
            <button
              onClick={handleUnlinkCaretaker}
              disabled={loading}
              className="btn bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm"
            >
              <LogOut size={14} className="inline mr-1" /> Unlink
            </button>
          </div>
        ) : (
          <div className="text-muted text-sm italic">
            No caretaker linked. Share your ID above to get started.
          </div>
        )}
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Link2 size={20} className="text-primary" /> Doctor Linking
        </h3>

        {currentDoctor ? (
          <div className="bg-green-50 text-green-800 p-4 rounded border border-green-200">
            <strong>Linked to Doctor ID:</strong> {currentDoctor}
            <p className="text-sm mt-1">Contact admin to unlink.</p>
          </div>
        ) : (
          <form onSubmit={handleLink}>
            <p className="text-sm text-muted mb-4">
              Enter your Doctor's Unique ID to link your account. This will
              allow them to view your vitals and manage your medicines.
            </p>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Enter Doctor ID"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
              />
              <button className="btn btn-primary">Link Account</button>
            </div>
          </form>
        )}
      </div>

      <button
        onClick={logout}
        className="btn w-full bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
      >
        <LogOut size={18} className="inline mr-2" /> Logout
      </button>
    </div>
  );
}
