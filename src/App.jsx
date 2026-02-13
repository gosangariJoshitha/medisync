import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import RegisterSelection from "./pages/RegisterSelection";
import RegisterPatient from "./pages/RegisterPatient";
import RegisterDoctor from "./pages/RegisterDoctor";
import Login from "./pages/Login";
// import DashboardPatient from "./pages/DashboardPatient";
// import DashboardDoctor from "./pages/DashboardDoctor"; // Replaced
// import DashboardCaretaker from "./pages/DashboardCaretaker";

import DoctorLayout from "./components/doctor/DoctorLayout";
import DoctorHome from "./pages/doctor/DoctorHome";
import AddPatient from "./pages/doctor/AddPatient";
import ViewPatients from "./pages/doctor/ViewPatients";
import MonitorPatients from "./pages/doctor/MonitorPatients";
import RiskPatients from "./pages/doctor/RiskPatients";
import Reports from "./pages/doctor/Reports";
import PatientDetails from "./pages/doctor/PatientDetails";
import DoctorSettings from "./pages/doctor/Settings";

import PatientLayout from "./components/patient/PatientLayout";
import PatientHome from "./pages/patient/PatientHome";
import MyMedicines from "./pages/patient/MyMedicines";
import Vitals from "./pages/patient/Vitals";
import AnalyticsRewards from "./pages/patient/AnalyticsRewards";
import Appointments from "./pages/patient/Appointments";
import Settings from "./pages/patient/Settings";

import CaretakerLayout from "./components/caretaker/CaretakerLayout";
import CaretakerHome from "./pages/caretaker/CaretakerHome";
import CaretakerSettings from "./pages/caretaker/Settings";
import PatientMonitor from "./pages/caretaker/PatientMonitor";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Registration Routes */}
            <Route
              path="/register/role-selection"
              element={<RegisterSelection />}
            />
            <Route path="/register/patient" element={<RegisterPatient />} />
            <Route path="/register/doctor" element={<RegisterDoctor />} />
          </Route>

          {/* Protected Dashboard Routes */}
          {/* 
            <Route 
              path="/dashboard/patient" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <DashboardPatient />
                </ProtectedRoute>
              } 
            /> 
            */}
          <Route
            path="/dashboard/doctor"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorHome />} />
            <Route path="add-patient" element={<AddPatient />} />
            <Route path="view-patients" element={<ViewPatients />} />
            <Route path="monitor" element={<MonitorPatients />} />
            <Route path="risk-patients" element={<RiskPatients />} />
            <Route path="risk-patients" element={<RiskPatients />} />
            <Route path="reports" element={<Reports />} />
            <Route path="patient/:id" element={<PatientDetails />} />
            <Route path="patient/:id" element={<PatientDetails />} />
            <Route path="settings" element={<DoctorSettings />} />
            {/* Other sub-routes will be added here */}
          </Route>

          {/* Patient Routes */}
          <Route
            path="/dashboard/patient"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientHome />} />
            <Route path="medicines" element={<MyMedicines />} />
            <Route path="vitals" element={<Vitals />} />
            <Route path="analytics" element={<AnalyticsRewards />} />
            <Route path="rewards" element={<AnalyticsRewards />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="settings" element={<Settings />} />
            {/* Added other patient routes later */}
          </Route>

          <Route
            path="/dashboard/caretaker"
            element={
              <ProtectedRoute allowedRoles={["caretaker"]}>
                <CaretakerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CaretakerHome />} />
            <Route path="monitor/:id" element={<PatientMonitor />} />
            {/* Other caretaker sub-routes */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
