import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../../../store/store";
import type { rootReducerState } from "../../../../slices/RootReducers";
import { fetchPendingDocuments, verifyDocument } from "../../../../slices/documentSlice";
import type { DriverDocumentData } from "../../../../Model/DriverDocumentData";

export function DocumentVerification() {
    const dispatch = useDispatch<AppDispatch>();
    const { pendingDocuments } = useSelector((state: rootReducerState) => state.documents);
    const [selectedDoc, setSelectedDoc] = useState<DriverDocumentData | null>(null);
    const [adminNotes, setAdminNotes] = useState("");

    useEffect(() => {
        dispatch(fetchPendingDocuments());
    }, [dispatch]);

    const handleVerify = async (status: "Verified" | "Rejected") => {
        if (!selectedDoc) return;
        try {
            await dispatch(verifyDocument({
                id: selectedDoc._id!,
                status,
                adminNotes
            })).unwrap();
            alert(`Document ${status} successfully!`);
            setSelectedDoc(null);
            setAdminNotes("");
        } catch (error: any) {
            alert(error.message || "Failed to verify document");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-8">
            <div className="bg-amber-600 px-6 py-4 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <span>🪪</span> Pending Document Verifications
                </h3>
                <span className="bg-amber-500 text-xs px-2 py-1 rounded-full font-bold">
                    {pendingDocuments.length} Pending
                </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {pendingDocuments.map((doc) => (
                    <div key={doc._id} className="p-4 hover:bg-gray-50 transition flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                <img src={doc.documentUrl} alt={doc.type} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">{doc.type}</div>
                                <div className="text-[10px] text-gray-500">
                                    Driver: {(doc.driverId as any)?.name} ({(doc.driverId as any)?.email})
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedDoc(doc)}
                            className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1 rounded-lg text-xs font-bold transition"
                        >
                            Review
                        </button>
                    </div>
                ))}

                {pendingDocuments.length === 0 && (
                    <div className="p-12 text-center text-gray-400 italic text-sm">
                        No pending documents to verify.
                    </div>
                )}
            </div>

            {/* Verification Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Image Preview Side */}
                        <div className="flex-1 bg-gray-900 flex items-center justify-center p-4">
                            <img src={selectedDoc.documentUrl} alt="Document Preview" className="max-w-full max-h-[70vh] object-contain shadow-2xl" />
                        </div>

                        {/* Actions Side */}
                        <div className="w-full md:w-80 bg-white p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Verify Document</h2>
                                <button onClick={() => setSelectedDoc(null)} className="text-2xl font-light text-gray-400">&times;</button>
                            </div>

                            <div className="mb-6 space-y-2">
                                <p className="text-sm"><strong>Type:</strong> {selectedDoc.type}</p>
                                <p className="text-sm"><strong>Driver:</strong> {(selectedDoc.driverId as any)?.name}</p>
                                {selectedDoc.expiryDate && (
                                    <p className="text-sm"><strong>Expiry:</strong> {new Date(selectedDoc.expiryDate).toLocaleDateString()}</p>
                                )}
                            </div>

                            <div className="flex-grow">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Admin Notes (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none h-32 text-sm"
                                    placeholder="Reason for rejection or verification notes..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                />
                            </div>

                            <div className="pt-6 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleVerify("Rejected")}
                                    className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-bold transition text-sm"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleVerify("Verified")}
                                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-200 transition text-sm"
                                >
                                    Verify
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
