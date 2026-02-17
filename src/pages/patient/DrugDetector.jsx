import { useState } from "react";
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Scan,
  PackageCheck,
} from "lucide-react";
import { motion as Motion } from "framer-motion";

export default function DrugDetector() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle, scanning, verified, fake

  const handleVerify = () => {
    if (!code) return;
    setStatus("scanning");

    setTimeout(() => {
      // Mock Verification Logix
      if (code.includes("FAKE") || code === "12345") {
        setStatus("fake");
      } else {
        setStatus("verified");
      }
    }, 2000);
  };

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-full mb-4">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Counterfeit Drug Detector
        </h1>
        <p className="text-gray-500">
          Verify the authenticity of your medicine batch instantly.
        </p>
      </div>

      <div className="card p-8 shadow-lg border-t-4 border-indigo-500">
        <label className="label font-bold text-gray-700">
          Enter Batch Number / Barcode ID
        </label>
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              className="input pl-10 uppercase tracking-widest font-mono"
              placeholder="e.g. BTC-90210-X"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <QrCode className="absolute left-3 top-3 text-gray-400" size={20} />
          </div>
          <button
            onClick={handleVerify}
            disabled={!code || status === "scanning"}
            className="btn btn-primary min-w-[120px]"
          >
            {status === "scanning" ? "Verifying..." : "Verify"}
          </button>
        </div>

        {/* Results Area */}
        <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50">
          {status === "idle" && (
            <div className="text-center text-gray-400">
              <Scan size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Scan result will appear here</p>
            </div>
          )}

          {status === "scanning" && (
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-ring loading-lg text-indigo-500"></span>
              <p className="text-indigo-600 font-medium animate-pulse">
                Checking Global Database...
              </p>
            </div>
          )}

          {status === "verified" && (
            <Motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center p-6"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageCheck size={40} />
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-1">
                Authentic Batch Confirmed
              </h3>
              <p className="text-green-600 mb-2">Batch #{code}</p>
              <p className="text-sm text-gray-500">
                Manufacturer: <strong>MediLife Pharma Inc.</strong>
                <br />
                Expiry: <strong>12/2028</strong>
              </p>
            </Motion.div>
          )}

          {status === "fake" && (
            <Motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center p-6"
            >
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={40} />
              </div>
              <h3 className="text-xl font-bold text-red-700 mb-1">
                Potential Counterfeit Detected
              </h3>
              <p className="text-red-600 mb-4">Batch #{code}</p>
              <div className="bg-red-50 p-3 rounded-lg text-left">
                <p className="text-sm text-red-800 font-bold mb-1">
                  Action Required:
                </p>
                <ul className="text-xs text-red-700 list-disc pl-4 space-y-1">
                  <li>Do not consume this medication.</li>
                  <li>Return to place of purchase immediately.</li>
                  <li>Report issue to local health authority.</li>
                </ul>
              </div>
            </Motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
