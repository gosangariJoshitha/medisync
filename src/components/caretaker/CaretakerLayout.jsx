import { Outlet } from "react-router-dom";
import CaretakerSidebar from "./CaretakerSidebar";
import CaretakerTopBar from "./CaretakerTopBar";

export default function CaretakerLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <CaretakerSidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ height: "100vh" }}
      >
        <CaretakerTopBar title="Guardian Portal" />
        <main
          className="flex-1 overflow-auto p-6"
          style={{ padding: "2rem", backgroundColor: "var(--background)" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
