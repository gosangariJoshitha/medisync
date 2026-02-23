import { useState, useEffect } from "react";
import { Phone, CheckCircle, CalendarDays, ExternalLink } from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CaretakerContactDoctor() {
  const { currentUser } = useAuth();
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchLinkedDoctors = async () => {
      if (!currentUser) return;
      try {
        const pQuery = query(
          collection(db, "patients"),
          where("caretakerUid", "==", currentUser.uid),
        );
        const pSnap = await getDocs(pQuery);

        const uQuery = query(
          collection(db, "users"),
          where("caretakerUid", "==", currentUser.uid),
        );
        const uSnap = await getDocs(uQuery);

        const docUids = new Set();
        const addToSet = (d) => {
          if (d.data().doctorUid) docUids.add(d.data().doctorUid);
        };
        pSnap.docs.forEach(addToSet);
        uSnap.docs.forEach(addToSet);

        const doctorList = [];
        for (const dId of docUids) {
          let dSnap = await getDoc(doc(db, "doctors", dId));
          if (!dSnap.exists()) {
            dSnap = await getDoc(doc(db, "users", dId));
          }
          if (dSnap.exists()) {
            doctorList.push({ id: dSnap.id, ...dSnap.data() });
          }
        }
        setDoctors(doctorList);
      } catch (err) {
        console.error("Failed to fetch linked doctors:", err);
      }
    };
    fetchLinkedDoctors();
  }, [currentUser]);

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 text-primary rounded-xl">
          <Phone size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Doctor</h1>
          <p className="text-gray-500 text-sm">
            Reach out to the specialists managing your linked patients.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {doctors.length > 0 ? (
          doctors.map((doc) => (
            <div
              key={doc.id}
              className="card p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Dr. {doc.fullName || "Unknown"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {doc.specialization || "General Medicine"}
                </p>
                <div className="space-y-2 mb-6 text-sm text-gray-600 border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Clinic:</span>{" "}
                    {doc.clinicAddress || "N/A"}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Phone:</span>{" "}
                    {doc.phone || "N/A"}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Email:</span>{" "}
                    {doc.email || "N/A"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1 py-2 text-sm"
                  onClick={() => {
                    const phone = doc.phone || doc.contactNumber;
                    if (phone) {
                      window.open(
                        `https://wa.me/${phone.replace(/\D/g, "")}`,
                        "_blank",
                      );
                    } else {
                      alert("No phone number available for messaging.");
                    }
                  }}
                >
                  Message
                </button>
                <button
                  className="btn btn-outline flex-1 py-2 text-sm"
                  onClick={() => {
                    const phone = doc.phone || doc.contactNumber;
                    if (phone) {
                      window.location.href = `tel:${phone}`;
                    } else {
                      alert("No phone number available for calling.");
                    }
                  }}
                >
                  <ExternalLink size={16} className="mr-1 inline" /> Call
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-12 text-center card bg-gray-50">
            <CheckCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="font-bold text-gray-700">No Doctors Linked</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2">
              None of your linked patients currently have a doctor assigned to
              their profile. Once they link a doctor, their contact info will
              appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
