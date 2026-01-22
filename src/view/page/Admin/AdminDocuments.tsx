import { useState, useEffect } from "react";
import { backendApi } from "../../../api";

interface PendingDocument {
    _id: string;
    driverId: {
        _id: string;
        name: string;
        email: string;
    };
    type: "License" | "Insurance" | "ID";
    documentUrl: string;
    status: string;
}

export function AdminDocuments() {
    const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchPendingDocuments();
    }, []);

    const fetchPendingDocuments = async () => {
        try {
            const res = await backendApi.get("/api/v1/documents/pending");
            setPendingDocs(res.data);
        } catch (error) {
            console.error("Failed to fetch pending documents", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, status: "Verified" | "Rejected") => {
        try {
            await backendApi.put(`/api/v1/documents/${id}/verify`, {
                status,
                adminNotes: adminNotes[id] || "",
            });
            alert(`Document ${status} successfully!`);
            fetchPendingDocuments(); // Refresh list
        } catch (error) {
            console.error(`Failed to ${status} document`, error);
            alert(`Failed to ${status} document`);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading pending documents...</div>;

    return (
        <div className="max-w-6xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6 text-blue-700">Document Verification Center</h1>

            {pendingDocs.length === 0 ? (
                <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500">
                    🎉 All caught up! No pending documents to review.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {pendingDocs.map((doc) => (
                        <div key={doc._id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-800">{doc.driverId.name}</h3>
                                    <p className="text-xs text-gray-500">{doc.driverId.email}</p>
                                </div>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold uppercase">
                                    {doc.type}
                                </span>
                            </div>

                            <div className="p-4 flex-grow">
                                <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                                    <img
                                        src={doc.documentUrl}
                                        alt={doc.type}
                                        className="w-full h-48 object-cover rounded shadow-inner group-hover:opacity-90 transition"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <span className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">View Full Screen 🔍</span>
                                    </div>
                                </a>

                                <div className="mt-4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Admin Feedback / Rejection Reason</label>
                                    <textarea
                                        className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Add notes for the driver..."
                                        rows={2}
                                        value={adminNotes[doc._id] || ""}
                                        onChange={(e) => setAdminNotes({ ...adminNotes, [doc._id]: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-4 mt-auto">
                                <button
                                    onClick={() => handleVerify(doc._id, "Rejected")}
                                    className="flex-1 bg-red-100 text-red-600 py-2 rounded font-bold hover:bg-red-200 transition"
                                >
                                    Reject ❌
                                </button>
                                <button
                                    onClick={() => handleVerify(doc._id, "Verified")}
                                    className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition shadow-md"
                                >
                                    Approve ✅
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
