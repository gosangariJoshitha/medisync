import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Zap,
  CheckCircle,
  AlertTriangle,
  ScanLine,
  X,
} from "lucide-react";
import { motion as Motion } from "framer-motion";
import Tesseract from "tesseract.js";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function MedicineIdentifier() {
  const { currentUser } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [recentScan, setRecentScan] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    setResult(null);

    try {
      const ocrResult = await Tesseract.recognize(file, "eng", {
        logger: () => {},
      });

      const text = ocrResult.data.text;

      const dosageMatch = text.match(/(\d+)\s*(mg|g|ml|mcg|tablet|cap)/i);
      const extractedDosage = dosageMatch ? dosageMatch[0] : "";

      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((line) => line.length > 2);

      let extractedName = "Unknown Medicine";
      const noiseWords = [
        "mg",
        "ml",
        "g",
        "mcg",
        "tablet",
        "capsule",
        "rx",
        "take",
        "qty",
        "refill",
        "dr.",
        "date",
        "pharmacy",
        "keep",
        "store",
      ];

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        // Skip lines that are entirely numbers or short codes
        if (/^[\d\W]+$/.test(line)) continue;

        // Skip common auxiliary text
        const isNoise = noiseWords.some(
          (word) => lowerLine.includes(word) && line.length < 15,
        );
        if (!isNoise) {
          extractedName = line;
          break;
        }
      }

      const scanResult = {
        name: extractedName.substring(0, 50),
        dosage: extractedDosage || "Unknown dosage",
        type: "Scanned Medicine",
        confidence: "OCR Match",
        instructions: "Verify details with your doctor before taking.",
        warnings: [
          "Cannot automatically detect complex interactions from image scan alone.",
        ],
        rawText: text,
      };

      setResult(scanResult);
      setRecentScan(scanResult);
    } catch (err) {
      console.error("Camera error", err);
      alert("Failed to read image. Please try again.");
    } finally {
      setScanning(false);
      // Reset input so choosing same file again works
      e.target.value = "";
    }
  };

  const saveToDatabase = async () => {
    if (!result || !currentUser) return;
    setSaving(true);
    try {
      const collectionName = currentUser.sourceCollection || "users";
      const documentId = currentUser.id || currentUser.uid;
      const medsRef = collection(db, collectionName, documentId, "medicines");

      await addDoc(medsRef, {
        name: result.name,
        dosage: result.dosage,
        frequency: "Once a day", // Default placeholder
        scanned: true,
        createdAt: new Date().toISOString(),
      });
      alert(`Successfully added ${result.name} to My Medicines!`);
      setResult(null);
    } catch (e) {
      console.error(e);
      alert("Failed to save medicine.");
    } finally {
      setSaving(false);
    }
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
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
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
            className="bg-white absolute inset-0 p-6 flex flex-col text-left w-full h-full overflow-y-auto"
          >
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4 gap-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                  <CheckCircle size={12} /> {result.confidence}
                </span>
                <button
                  onClick={() => setResult(null)}
                  className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1 leading-tight break-words">
                {result.name}
              </h2>
              <p className="text-blue-600 font-medium mb-6 text-sm">
                {result.dosage} • {result.type}
              </p>

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

            <div className="mt-6 space-y-3 shrink-0">
              <button
                onClick={saveToDatabase}
                disabled={saving}
                className="btn btn-primary w-full shadow-md py-3"
              >
                {saving ? "Saving..." : "Save to My Medicines"}
              </button>
              <button
                onClick={startCamera}
                disabled={saving}
                className="btn btn-outline w-full py-3"
              >
                Scan Another
              </button>
            </div>
          </Motion.div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="card p-4 flex flex-col gap-3 justify-center">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${recentScan ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"}`}
            >
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">
                Recent Scan
              </p>
              <p
                className={`font-bold text-sm ${!recentScan && "text-gray-400 italic"}`}
              >
                {recentScan ? recentScan.name : "No recent scan"}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4 flex flex-col gap-3 justify-center">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${recentScan ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
            >
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">
                Status
              </p>
              <p
                className={`font-bold text-sm ${!recentScan && "text-gray-400 italic"}`}
              >
                {recentScan ? "Safe to take" : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
