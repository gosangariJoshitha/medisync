import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import {
  Save,
  User,
  Mail,
  Stethoscope,
  Bell,
  Shield,
  Phone,
  Lock,
  Trash2,
} from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";

export default function Settings() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'alerts', 'security'

  return (
    <div className="fade-in max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-muted">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <TabButton
          id="profile"
          label="Profile"
          icon={<User size={18} />}
          active={activeTab === "profile"}
          onClick={setActiveTab}
        />
        <TabButton
          id="alerts"
          label="Alerts"
          icon={<Bell size={18} />}
          active={activeTab === "alerts"}
          onClick={setActiveTab}
        />
        <TabButton
          id="security"
          label="Security"
          icon={<Shield size={18} />}
          active={activeTab === "security"}
          onClick={setActiveTab}
        />
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <ProfileSettings key="profile" currentUser={currentUser} />
          )}
          {activeTab === "alerts" && (
            <AlertsSettings key="alerts" currentUser={currentUser} />
          )}
          {activeTab === "security" && (
            <SecuritySettings key="security" currentUser={currentUser} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ id, label, icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
        active ? "text-primary" : "text-muted hover:text-gray-800"
      }`}
    >
      {icon}
      {label}
      {active && (
        <Motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        />
      )}
    </button>
  );
}

function ProfileSettings({ currentUser }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    specialty: "",
    phone: "",
    hospital: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            fullName: data.fullName || "",
            email: currentUser.email,
            specialty: data.specialty || "",
            phone: data.phone || "",
            hospital: data.hospital || "MediSync General Hospital",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: formData.fullName,
        specialty: formData.specialty,
        phone: formData.phone,
        hospital: formData.hospital,
      });
      alert("Profile Saved!");
    } catch (e) {
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="card"
    >
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <User size={20} /> Personal Information
      </h2>
      <p className="text-sm text-muted mb-6">Update your personal details</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="label">Full Name</label>
            <input
              className="input"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input bg-gray-50 text-muted"
              value={formData.email}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="label">Phone Number</label>
            <input
              className="input"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 234..."
            />
          </div>
        </div>

        <div className="border-t pt-6 mt-2">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Stethoscope size={20} /> Professional Details
          </h2>
          <p className="text-sm text-muted mb-6">
            Update your hospital and specialization
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="label">Hospital / Clinic</label>
              <input
                className="input"
                value={formData.hospital}
                onChange={(e) =>
                  setFormData({ ...formData, hospital: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="label">Specialization</label>
              <input
                className="input"
                value={formData.specialty}
                onChange={(e) =>
                  setFormData({ ...formData, specialty: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-start">
          <button disabled={saving} className="btn btn-primary">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Motion.div>
  );
}

function AlertsSettings({ currentUser }) {
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    missedDose: true,
    criticalAlerts: true,
    dailySummary: false,
  });
  const [loading, setLoading] = useState(false); // Mock loading for simplicity

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call or update Firestore 'preferences' field
    setTimeout(() => {
      setLoading(false);
      alert("Preferences Saved");
    }, 800);
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="card"
    >
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Bell size={20} /> Notification Preferences
      </h2>
      <p className="text-sm text-muted mb-6">
        Choose how you want to be notified
      </p>

      <div className="space-y-6">
        <ToggleRow
          label="Email Alerts"
          desc="Receive alerts via email"
          checked={preferences.emailAlerts}
          onChange={() => handleToggle("emailAlerts")}
        />
        <ToggleRow
          label="Missed Dose Alerts"
          desc="Get notified when patients miss doses"
          checked={preferences.missedDose}
          onChange={() => handleToggle("missedDose")}
        />
        <ToggleRow
          label="Critical Health Alerts"
          desc="Urgent notifications for critical patients"
          checked={preferences.criticalAlerts}
          onChange={() => handleToggle("criticalAlerts")}
        />
        <div className="border-t pt-4">
          <ToggleRow
            label="Daily Summary"
            desc="Receive daily patient adherence summary"
            checked={preferences.dailySummary}
            onChange={() => handleToggle("dailySummary")}
          />
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </Motion.div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-sm text-muted">{desc}</p>
      </div>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? "bg-primary" : "bg-gray-200"}`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function SecuritySettings({ currentUser }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert("Please fill in both fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(currentUser, newPassword);
      alert("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      alert("Failed to update password: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="card">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Shield size={20} /> Change Password
        </h2>
        <p className="text-sm text-muted mb-6">Update your account password</p>

        <div className="space-y-4 max-w-lg">
          <div className="form-group">
            <label className="label">New Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Confirm Password</label>
            <input
              className="input"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="btn btn-primary bg-gray-800 hover:bg-gray-900 border-none text-white"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      <div className="card border-red-100 bg-red-50">
        <h2 className="text-lg font-semibold mb-1 text-red-700 flex items-center gap-2">
          Danger Zone
        </h2>
        <p className="text-sm text-red-600 mb-6">Irreversible actions</p>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-700">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
          </div>
          <button
            onClick={() => {
              if (
                window.confirm("ARE YOU SURE? This action cannot be undone.")
              ) {
                alert("Account deletion request sent to admin.");
              }
            }}
            className="btn bg-red-600 hover:bg-red-700 text-white border-none"
          >
            Delete Account
          </button>
        </div>
      </div>
    </Motion.div>
  );
}
