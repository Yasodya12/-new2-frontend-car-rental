import { useState, useEffect } from "react";
import { backendApi } from "../../../api";
import { ImageUpload } from "../../components/ImageUpload/ImageUpload";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

interface DriverDocument {
    _id: string;
    type: "License" | "ID";
    documentUrl: string;
    expiryDate?: string;
    status: "Pending" | "Verified" | "Rejected";
    adminNotes?: string;
}

export function Documents() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [documents, setDocuments] = useState<DriverDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && (user as any).id) {
            fetchDocuments();
        }
    }, [user]);

    const fetchDocuments = async () => {
        try {
            const driverId = (user as any).id;
            const res = await backendApi.get(`/api/v1/documents/driver/${driverId}`);
            setDocuments(res.data);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = async (type: "License" | "ID", url: string) => {
        try {
            await backendApi.post("/api/v1/documents", {
                type,
                documentUrl: url,
            });
            alert(`${type} uploaded successfully!`);
            fetchDocuments(); // Refresh list
        } catch (error) {
            console.error(`Failed to upload ${type}`, error);
            alert(`Failed to upload ${type}`);
        }
    };

    const getDocByType = (type: string) => documents.find(d => d.type === type);

    const renderDocumentSection = (type: "License" | "ID", title: string, description: string) => {
        const doc = getDocByType(type);

        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                        <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    {doc && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.status === "Verified" ? "bg-green-100 text-green-700" :
                            doc.status === "Rejected" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                            }`}>
                            {doc.status}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <ImageUpload
                            onUpload={(url) => handleUploadComplete(type, url)}
                            label={`Upload ${title}`}
                        />
                    </div>

                    <div className="flex flex-col justify-center border-l border-gray-100 pl-6">
                        {doc ? (
                            <>
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Current Preview:</p>
                                    <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={doc.documentUrl}
                                            alt={type}
                                            className="h-32 w-full object-cover rounded border hover:opacity-80 transition"
                                        />
                                    </a>
                                </div>
                                {doc.adminNotes && (
                                    <div className="bg-red-50 p-3 rounded text-sm text-red-600 border border-red-100">
                                        <strong>Admin Notes:</strong> {doc.adminNotes}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded text-gray-400 italic">
                                No document uploaded yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center">Loading documents...</div>;

    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-bold mb-2 text-blue-700">Driver Verification Documents</h1>
            <p className="text-gray-600 mb-8">Please upload clear photos of your valid documents. Our admins will review them shortly.</p>

            <div className="space-y-8">
                {renderDocumentSection("ID", "NIC / National ID", "Upload both front and back if possible in one image.")}
                {renderDocumentSection("License", "Driving License", "Ensure the license number and expiry date are clearly visible.")}
            </div>
        </div>
    );
}
