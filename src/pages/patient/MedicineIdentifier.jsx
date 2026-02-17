import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Zap,
  CheckCircle,
  AlertTriangle,
  ScanLine,
} from "lucide-react";
import { motion as Motion } from "framer-motion";

export default function MedicineIdentifier() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const videoRef = useRef(null);

  const startCamera = async () => {
    setScanning(true);
    setResult(null);
    try {
      // Mock camera start for now to avoid permission issues in some envs
      // In real app: navigator.mediaDevices.getUserMedia({ video: true })
      setTimeout(() => {
        handleScan();
      }, 3000);
    } catch (err) {
      console.error("Camera error", err);
      setScanning(false);
    }
  };

  const handleScan = () => {
    setScanning(false);
    // Mock Result
    setResult({
      name: "Amoxicillin 500mg",
      type: "Antibiotic",
      confidence: "98%",
      instructions: "Take with food. Complete full course.",
      warnings: ["May cause drowsiness", "Avoid alcohol"],
    });
  };

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AR Medicine Identifier
        </h1>
        <p className="text-gray-500">
          Point your camera at a pill or blister pack to identify it instantly.
        </p>
      </div>

      <div className="card p-4 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center bg-gray-900 rounded-3xl">
        {!result && !scanning && (
          <div className="text-center text-white/80">
            <ScanLine size={64} className="mx-auto mb-4 opacity-50" />
            <button
              onClick={startCamera}
              className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-blue-500/30"
            >
              <Camera className="mr-2" /> Start Scanner
            </button>
          </div>
        )}

        {scanning && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
            <div className="w-64 h-64 border-2 border-blue-500 rounded-2xl relative animate-pulse flex items-center justify-center">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
              <span className="text-blue-400 text-sm font-mono animate-bounce">
                Scanning...
              </span>
            </div>
            <p className="text-gray-400 mt-8 text-sm">
              Align medicine within the frame
            </p>
          </div>
        )}

        {result && (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white absolute inset-0 p-6 flex flex-col text-left w-full h-full"
          >
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle size={12} /> {result.confidence} Match
                </span>
                <button
                  onClick={() => setResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {result.name}
              </h2>
              <p className="text-blue-600 font-medium mb-6">{result.type}</p>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 text-sm mb-1">
                    Instructions
                  </h4>
                  <p className="text-blue-800 text-sm">{result.instructions}</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <h4 className="font-bold text-orange-900 text-sm mb-1 flex items-center gap-2">
                    <AlertTriangle size={14} /> Warnings
                  </h4>
                  <ul className="list-disc pl-4 text-orange-800 text-sm">
                    {result.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={startCamera}
              className="btn btn-outline w-full mt-4"
            >
              Scan Another
            </button>
          </Motion.div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">
              Recent Scan
            </p>
            <p className="font-bold text-sm">Metformin 500mg</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg text-green-600">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
            <p className="font-bold text-sm">Safe to take</p>
          </div>
        </div>
      </div>
    </div>
  );
}
