import { useEffect } from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${styles[type]}`}
        >
          {icons[type]}
          <p className="font-medium text-sm">{message}</p>
          <button
            onClick={onClose}
            className="opacity-50 hover:opacity-100 ml-2"
          >
            <X size={16} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
