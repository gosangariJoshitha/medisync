import { Outlet } from "react-router-dom";
import PatientSidebar from "./PatientSidebar";
import PatientTopBar from "./PatientTopBar";
import RSsAlarm from "./RSsAlarm";

export default function PatientLayout() {
  console.log("[DEBUG] Rendering PatientLayout");
  return (
    <div className="flex h-screen bg-gray-50">
      <PatientSidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ height: "100vh" }}
      >
        <PatientTopBar />
        <main
          className="flex-1 overflow-auto p-6"
          style={{
            padding: "2rem",
            backgroundColor: "var(--background)",
          }}
        >
          <Outlet />
        </main>
      </div>
      <RSsAlarm />
    </div>
  );
}
