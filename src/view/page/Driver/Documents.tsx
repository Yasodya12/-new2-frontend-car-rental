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
            <div className="bg-card-dark border border-border-dark rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${doc?.status === 'Verified' ? 'bg-accent/20 text-accent' : 'bg-bg-dark text-text-muted'
                            }`}>
                            {doc?.status === 'Verified' ? '✓' : '1'}
                        </div>
                        <h3 className="text-xl font-bold text-text-light">{title}</h3>
                    </div>
                    <p className="text-sm text-text-muted mb-6 pl-13">{description}</p>

                    <div className="max-w-md ml-13">
                        <ImageUpload
                            onUpload={(url) => handleUploadComplete(type, url)}
                            label={`Select ${title} File`}
                        />
                    </div>
                </div>

                <div className="w-full lg:w-80 space-y-4">
                    <div className="bg-bg-dark/50 border border-border-dark rounded-xl p-4">
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-3">Verification Status</p>
                        {doc ? (
                            <div className="space-y-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${doc.status === 'Verified' ? 'bg-accent/10 text-accent border border-accent/20' :
                                        doc.status === 'Rejected' ? 'bg-danger/10 text-danger border border-danger/20' :
                                            'bg-warning/10 text-warning border border-warning/20'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${doc.status === 'Verified' ? 'bg-accent' :
                                            doc.status === 'Rejected' ? 'bg-danger' :
                                                'bg-warning'
                                        }`}></div>
                                    {doc.status}
                                </div>

                                <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="block relative group rounded-xl overflow-hidden border border-border-dark shadow-inner">
                                    <img src={doc.documentUrl} alt={type} className="h-32 w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">View Document</span>
                                    </div>
                                </a>

                                {doc.adminNotes && (
                                    <div className="bg-danger/5 border border-danger/20 p-3 rounded-lg">
                                        <p className="text-[10px] text-danger font-bold uppercase mb-1">Feedback</p>
                                        <p className="text-xs text-text-muted italic">{doc.adminNotes}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center border-2 border-dashed border-border-dark rounded-xl">
                                <p className="text-xs text-text-muted font-medium italic">Pending Upload</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-bg-dark flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-dark pt-12 pb-24 px-6 lg:px-12">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-3">
                        <span>Personnel</span>
                        <span className="text-text-muted">/</span>
                        <span>Compliance</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-text-light mb-3">Verification Center</h1>
                    <p className="text-text-muted max-w-2xl font-medium">
                        Complete your professional profile by uploading required legal documentation. Verified drivers receive priority booking allocation.
                    </p>
                </header>

                <div className="space-y-8">
                    {renderDocumentSection("ID", "National Identity Card", "Official government identification (NIC). Ensure both sides are clearly visible in the captured frame.")}
                    {renderDocumentSection("License", "Driving Credentials", "A valid professional driving license for the registered vehicle category.")}
                </div>
            </div>
        </div>
    );
}
