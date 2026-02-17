import { useState } from "react";
import { ShoppingBag, Clock, Pill, Truck, RefreshCw } from "lucide-react";

export default function Pharmacy() {
  const [refills] = useState([
    { id: 1, name: "Metformin 500mg", daysLeft: 5, status: "Low" },
    { id: 2, name: "Atorvastatin 20mg", daysLeft: 22, status: "Good" },
  ]);

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <ShoppingBag className="text-pink-500" /> Pharmacy & Refills
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-br from-pink-50 to-white border-pink-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-pink-500" /> Refill Assistant
          </h3>
          <div className="space-y-4">
            {refills.map((med) => (
              <div
                key={med.id}
                className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"
              >
                <div>
                  <p className="font-bold text-sm text-gray-800">{med.name}</p>
                  <p
                    className={`text-xs font-bold ${med.daysLeft <= 7 ? "text-red-500" : "text-green-500"}`}
                  >
                    {med.daysLeft} days supply left
                  </p>
                </div>
                {med.daysLeft <= 7 && (
                  <button className="btn btn-xs btn-primary">Order</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 md:col-span-2">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Truck size={18} className="text-blue-500" /> Active Orders
          </h3>
          <div className="bg-gray-50 rounded-xl p-8 text-center border-dashed border-2 border-gray-200">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw size={24} />
            </div>
            <p className="text-gray-500 font-medium">No active orders</p>
            <p className="text-sm text-gray-400">
              Your recent refills will appear here.
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Smart Reminders</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
            <Pill size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">
              Missed Dose Pattern Detected
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              You often miss your evening dose on Fridays. Would you like to set
              a stronger alarm?
            </p>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-xs btn-primary">Enable Alarm</button>
              <button className="btn btn-xs btn-ghost text-gray-500">
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Optimization Suggestion</h4>
            <p className="text-sm text-gray-600 mt-1">
              Taking Metformin with dinner reduces side effects. We can adjust
              your schedule.
            </p>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-xs btn-primary">Adjust Time</button>
              <button className="btn btn-xs btn-ghost text-gray-500">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
