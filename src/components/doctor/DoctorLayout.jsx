import { Outlet } from "react-router-dom";
import DoctorSidebar from "./DoctorSidebar";
import DoctorTopBar from "./DoctorTopBar";

export default function DoctorLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <DoctorSidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ height: "100vh" }}
      >
        <DoctorTopBar />
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
    </div>
  );
}
