import { useState, useEffect, useRef } from "react";
import { Plus, ScanLine, AlertCircle, X, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";

export default function MedicineForm({
  medicines,
  setMedicines,
  onClose,
  onSave,
  editMode = false,
  initialData = null,
}) {
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef(null);

  const periodTimes = {
    Morning: { min: "06:00", max: "11:59" },
    Afternoon: { min: "12:00", max: "17:59" },
    Evening: { min: "18:00", max: "21:59" },
    Night: { min: "22:00", max: "05:59" },
  };

  const initialMedState = {
    name: "",
    dosage: "",
    refillRemaining: "",
    frequency: "Once a day",
    startDate: new Date().toISOString().split("T")[0],
    durationValue: "7",
    durationUnit: "days",
    endDate: "",
    relationToMeal: "After meal",
    icon: "Pill",
    color: "#3B82F6",
  };

  const [newMed, setNewMed] = useState(initialMedState);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [specificTimes, setSpecificTimes] = useState({});

  useEffect(() => {
    if (editMode && initialData) {
      setNewMed(initialData);
      setSelectedPeriods(initialData.selectedPeriods || []);

      const timesObj = {};
      if (initialData.selectedPeriods && initialData.times) {
        initialData.selectedPeriods.forEach((p, idx) => {
          timesObj[p] = initialData.times[idx];
        });
      }
      setSpecificTimes(timesObj);
    }
  }, [editMode, initialData]);

  const calculateEndDate = (start, val, unit) => {
    if (unit === "continuous") return "Continuous";
    const date = new Date(start);
    if (unit === "days") date.setDate(date.getDate() + parseInt(val || 0));
    if (unit === "weeks") date.setDate(date.getDate() + parseInt(val || 0) * 7);
    if (unit === "months") date.setMonth(date.getMonth() + parseInt(val || 0));
    return date.toISOString().split("T")[0];
  };

  // Recalculate end date on mount
  useEffect(() => {
    if (!editMode) {
      setNewMed((prev) => ({
        ...prev,
        endDate: calculateEndDate(
          prev.startDate,
          prev.durationValue,
          prev.durationUnit,
        ),
      }));
    }
  }, [editMode]);

  const handleAddKey = (e) => {
    const { name, value } = e.target;
    setNewMed((prev) => {
      const updated = { ...prev, [name]: value };
      if (
        name === "startDate" ||
        name === "durationValue" ||
        name === "durationUnit"
      ) {
        updated.endDate = calculateEndDate(
          updated.startDate,
          updated.durationValue,
          updated.durationUnit,
        );
      }
      return updated;
    });
  };

  const getFrequencyCount = (freq) => {
    const map = { "Once a day": 1, "Twice a day": 2, "Thrice a day": 3 };
    return map[freq] || 1;
  };

  const togglePeriod = (p) => {
    const maxCount = getFrequencyCount(newMed.frequency);

    if (selectedPeriods.includes(p)) {
      // Deselect
      setSelectedPeriods(selectedPeriods.filter((item) => item !== p));
      const newTimes = { ...specificTimes };
      delete newTimes[p];
      setSpecificTimes(newTimes);
    } else {
      // Select
      if (selectedPeriods.length < maxCount) {
        setSelectedPeriods([...selectedPeriods, p]);
      } else if (maxCount === 1) {
        // Auto-swap for single frequency
        const oldPeriod = selectedPeriods[0];
        const newTimes = { ...specificTimes };
        delete newTimes[oldPeriod];
        setSpecificTimes(newTimes);
        setSelectedPeriods([p]);
      } else {
        alert(
          `You can only select ${maxCount} time periods for this frequency.`,
        );
      }
    }
  };

  const handleTimeChange = (period, time) => {
    if (!time) {
      setSpecificTimes({ ...specificTimes, [period]: "" });
      return;
    }
    const { min, max } = periodTimes[period];

    // Check if range crosses midnight (e.g., Night: 22:00 -> 05:59)
    const isOvernight = min > max;
    let isValid = false;

    if (isOvernight) {
      // Valid if time >= min OR time <= max
      isValid = time >= min || time <= max;
    } else {
      // Normal range: min <= time <= max
      isValid = time >= min && time <= max;
    }

    if (isValid) {
      setSpecificTimes({ ...specificTimes, [period]: time });
    } else {
      // Input is outside range; do not update state
      const msg = isOvernight
        ? `Please select a time between ${min} and ${max} (overnight) for ${period}.`
        : `Please select a time between ${min} and ${max} for ${period}.`;
      alert(msg);
    }
  };

  // Mock Drug Interaction Database
  const DRUG_INTERACTIONS = [
    {
      pair: ["Aspirin", "Warfarin"],
      severity: "High",
      description: "Increased risk of bleeding.",
    },
    {
      pair: ["Lisinopril", "Potassium"],
      severity: "Moderate",
      description: "Risk of high potassium levels (Hyperkalemia).",
    },
    {
      pair: ["Ibuprofen", "Naproxen"],
      severity: "Moderate",
      description: "Increased risk of stomach ulcers and side effects.",
    },
    {
      pair: ["Metformin", "Contrast Dye"],
      severity: "High",
      description: "Risk of lactic acidosis. Stop Metformin before procedure.",
    },
    {
      pair: ["Simvastatin", "Grapefruit"],
      severity: "Moderate",
      description: "Increases statin levels, risk of muscle toxicity.",
    },
  ];

  const addMedicine = () => {
    const freqMap = { "Once a day": 1, "Twice a day": 2, "Thrice a day": 3 };
    const requiredCount = freqMap[newMed.frequency] || 1;

    if (!newMed.name) return alert("Medicine Name is required");
    if (!newMed.dosage) return alert("Dosage is required");

    // --- AI Drug Interaction Checker ---
    const newMedName = newMed.name.trim().toLowerCase();
    const conflictingMed = medicines.find((existing) => {
      const existingName = existing.name.trim().toLowerCase();
      // Check if this pair exists in our DB
      return DRUG_INTERACTIONS.some((interaction) => {
        const pairLower = interaction.pair.map((n) => n.toLowerCase());
        return (
          pairLower.includes(newMedName) && pairLower.includes(existingName)
        );
      });
    });

    if (conflictingMed) {
      const interactionDetails = DRUG_INTERACTIONS.find((i) => {
        const pairLower = i.pair.map((n) => n.toLowerCase());
        return (
          pairLower.includes(newMedName) &&
          pairLower.includes(conflictingMed.name.trim().toLowerCase())
        );
      });

      const proceed = window.confirm(
        `⚠️ AI INTERACTION ALERT ⚠️\n\nPotential conflict detected between:\n- ${newMed.name}\n- ${conflictingMed.name}\n\nSeverity: ${interactionDetails?.severity}\nRisk: ${interactionDetails?.description}\n\nDo you want to proceed anyway?`,
      );

      if (!proceed) return; // Stop if doctor cancels
    }
    // -----------------------------------
    if (selectedPeriods.length !== requiredCount) {
      return alert(`Please select exactly ${requiredCount} time period(s).`);
    }

    const times = selectedPeriods.map((p) => specificTimes[p]);
    if (times.some((t) => !t))
      return alert("Please enter valid times for all selected periods.");

    const medicine = {
      ...newMed,
      id: Date.now(),
      selectedPeriods,
      times,
      timeDisplay: times.join(", "),
    };

    if (onSave) {
      onSave(medicine);
    } else {
      setMedicines([...medicines, medicine]);
    }

    setNewMed(initialMedState);
    setSelectedPeriods([]);
    setSpecificTimes({});
    onClose();
  };

  const handleScanClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setShowScanner(true);
    setScanning(true);

    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: () => {},
      });

      const text = result.data.text;
      // console.log("OCR Result:", text);

      // Simple parsing logic:
      // 1. Try to find a dosage pattern (e.g., 500mg, 10mg)
      const dosageMatch = text.match(/(\d+)\s*(mg|g|ml|tablet|cap)/i);
      const extractedDosage = dosageMatch ? dosageMatch[0] : "";

      // 2. Try to find name (First line that isn't empty/special chars, or the line before dosage?)
      // Let's just grab the most confident tokens, or for now, the first non-empty line.
      const lines = text.split("\n").filter((line) => line.trim().length > 3);
      const extractedName = lines.length > 0 ? lines[0] : "Unknown";

      setNewMed((prev) => ({
        ...prev,
        name: extractedName.substring(0, 50), // Limit length
        dosage: extractedDosage || prev.dosage,
      }));
    } catch (err) {
      console.error("OCR Error:", err);
      alert(
        "Failed to scan image. Please try again or enter details manually.",
      );
    } finally {
      setScanning(false);
      // Keep scanner overlay open for a second to show "Done" or just close it?
      // Let's close it after a brief delay
      setTimeout(() => setShowScanner(false), 1000);
    }
  };

  const iconOptions = ["Pill", "Bottle", "Syringe", "Inhaler"];
  const colorOptions = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];

  return (
    <div className="fade-in">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />

      <div className="flex gap-6">
        <div className="flex-1 space-y-5">
          {/* Scanner Area - Text then Icon */}
          <div
            onClick={handleScanClick}
            className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-100 transition-colors group"
          >
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Scan Prescription
            </h3>
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-colors">
              <ScanLine size={32} />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicine name
            </label>
            <input
              name="name"
              value={newMed.name}
              onChange={handleAddKey}
              className="input w-full"
              placeholder="e.g. Lisinopril"
            />
          </div>

          {/* Dosage & Refill */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage
              </label>
              <input
                name="dosage"
                value={newMed.dosage}
                onChange={handleAddKey}
                className="input w-full"
                placeholder="10 mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refill remaining (pills)
              </label>
              <input
                name="refillRemaining"
                value={newMed.refillRemaining}
                onChange={handleAddKey}
                className="input w-full"
                placeholder="30"
              />
            </div>
          </div>

          {/* Frequency & Periods */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Frequency
              </label>
            </div>
            <select
              name="frequency"
              value={newMed.frequency}
              onChange={handleAddKey}
              className="input w-full mb-3"
            >
              <option>Once a day</option>
              <option>Twice a day</option>
              <option>Thrice a day</option>
            </select>

            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Time of day
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {Object.keys(periodTimes).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => togglePeriod(period)}
                  className={`p-2 rounded border text-center transition-colors ${
                    selectedPeriods.includes(period)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-sm font-medium">{period}</div>
                  <div className="text-xs opacity-80">
                    ({periodTimes[period].min}-{periodTimes[period].max})
                  </div>
                </button>
              ))}
            </div>

            {/* Dynamic Time Inputs */}
            {selectedPeriods.length > 0 && (
              <div className="bg-gray-50 p-3 rounded border">
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  SELECTED TIMES:
                </label>
                <div className="space-y-2">
                  {selectedPeriods.map((period) => (
                    <div key={period} className="flex items-center gap-2">
                      <span className="text-sm w-20">{period}:</span>
                      <input
                        type="time"
                        className="input p-1"
                        min={periodTimes[period].min}
                        max={periodTimes[period].max}
                        value={specificTimes[period] || ""}
                        onChange={(e) =>
                          handleTimeChange(period, e.target.value)
                        }
                      />
                      <button
                        onClick={() => togglePeriod(period)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Start Date & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={newMed.startDate}
                onChange={handleAddKey}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <div className="flex gap-2">
                <input
                  name="durationValue"
                  value={newMed.durationValue}
                  onChange={handleAddKey}
                  className="input w-20"
                />
                <select
                  name="durationUnit"
                  value={newMed.durationUnit}
                  onChange={handleAddKey}
                  className="input flex-1"
                >
                  <option>days</option>
                  <option>weeks</option>
                  <option>months</option>
                  <option value="continuous">continuous</option>
                </select>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Ends: {newMed.endDate}
              </div>
            </div>
          </div>

          {/* Relation to Meal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relation to meal
            </label>
            <select
              name="relationToMeal"
              value={newMed.relationToMeal}
              onChange={handleAddKey}
              className="input w-full"
            >
              <option>After meal</option>
              <option>Before meal</option>
              <option>With meal</option>
              <option>Empty stomach</option>
            </select>
          </div>

          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <select
                name="icon"
                value={newMed.icon}
                onChange={handleAddKey}
                className="input w-full"
              >
                {iconOptions.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-2 mt-1">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewMed({ ...newMed, color: c })}
                    className={`w-6 h-6 rounded-full ${newMed.color === c ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          {/* Actions - Scanner moved to icon, just filler here or empty */}
          <div className="pt-4 flex gap-3">
            {/* Spacer or additional actions if validation needed */}
          </div>
        </div>

        {/* Right Column (Preview & Save) */}
        <div className="w-80 space-y-6">
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h4 className="font-semibold mb-2">Medicine Summary</h4>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-gray-500">Name:</span>{" "}
                {newMed.name || "-"}
              </p>
              <p>
                <span className="text-gray-500">Dosage:</span>{" "}
                {newMed.dosage || "-"}
              </p>
              <p>
                <span className="text-gray-500">Frequency:</span>{" "}
                {newMed.frequency}
              </p>
              <p>
                <span className="text-gray-500">Times:</span>{" "}
                {selectedPeriods.join(", ") || "-"}
              </p>
              <p>
                <span className="text-gray-500">Duration:</span>{" "}
                {newMed.endDate === "Continuous"
                  ? "Continuous"
                  : `${newMed.durationValue} ${newMed.durationUnit}`}
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <AlertCircle size={16} className="inline mr-1" />
              Check interactions functionality would go here.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={addMedicine}
              className="btn btn-primary w-full py-3 text-lg"
            >
              <Plus size={20} /> Save Medicine
            </button>
            <button onClick={onClose} className="btn btn-outline w-full">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm mx-4">
            {scanning ? (
              <>
                <Loader2
                  size={40}
                  className="animate-spin text-blue-500 mx-auto mb-4"
                />
                <h3 className="text-xl font-bold mb-2">
                  Scanning Prescription...
                </h3>
                <p className="text-gray-500 text-sm">
                  Extracting medicine details using OCR
                </p>
              </>
            ) : (
              <>
                <div className="text-green-500 mb-2 font-bold text-4xl">✓</div>
                <h3 className="text-xl font-bold mb-2">Scan Complete!</h3>
                <p className="text-gray-500 text-sm">
                  Details have been auto-filled.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
