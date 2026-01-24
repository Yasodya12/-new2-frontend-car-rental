import { useState, useEffect } from "react";
import { backendApi } from "../../../api";

interface DriverApproval {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    isApproved: boolean;
    documents: {
        _id: string;
        type: "License" | "ID";
        documentUrl: string;
        status: "Pending" | "Verified" | "Rejected";
        adminNotes?: string;
    }[];
    location?: {
        address?: string;
    };
}

export function AdminDocuments() {
    const [approvals, setApprovals] = useState<DriverApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        try {
            const res = await backendApi.get("/api/v1/users/driver-approvals");
            setApprovals(res.data);
        } catch (error) {
            console.error("Failed to fetch driver approvals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyDoc = async (docId: string, status: "Verified" | "Rejected") => {
        setProcessingId(docId);
        try {
            await backendApi.put(`/api/v1/documents/${docId}/verify`, {
                status,
                adminNotes: adminNotes[docId] || "",
            });
            await fetchApprovals(); // Refresh the whole list to get updated status
        } catch (error) {
            console.error(`Failed to ${status} document`, error);
            alert(`Failed to ${status} document`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveDriver = async (driverId: string) => {
        setProcessingId(driverId);
        try {
            await backendApi.patch(`/api/v1/users/approve-driver/${driverId}`);
            alert("Driver account activated successfully! 🎉");
            await fetchApprovals();
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Approval failed";
            alert(errorMsg);
        } finally {
            setProcessingId(null);
        }
    };

    const isReadyForApproval = (driver: DriverApproval) => {
        const mandatoryTypes = ["License", "ID"];
        return mandatoryTypes.every(type =>
            driver.documents.some(doc => doc.type === type && doc.status === "Verified")
        );
    };

    if (loading) return <div className="p-10 text-center text-blue-600 font-bold">Loading Driver Approval Center...</div>;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-blue-800 mb-2">Driver Approval Center</h1>
                <p className="text-gray-500 font-medium">Review documents and activate new driver accounts in one place.</p>
            </div>

            {approvals.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl shadow-xl text-center border-2 border-dashed border-gray-200">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-2xl font-bold text-gray-700">All Caught Up!</h2>
                    <p className="text-gray-500 mt-2">No drivers currently need approval or have pending documents.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-12">
                    {approvals.map((driver) => (
                        <div key={driver._id} className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row shadow-blue-100/50">
                            {/* Driver Profile Sidebar */}
                            <div className="lg:w-1/4 bg-gray-50 p-8 border-r border-gray-100 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    {driver.profileImage ? (
                                        <img
                                            src={driver.profileImage.startsWith("http") ? driver.profileImage : `http://localhost:3000/uploads/profile/${driver.profileImage}`}
                                            alt={driver.name}
                                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-5xl border-4 border-white shadow-lg font-black uppercase">
                                            {driver.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white shadow-sm ${driver.isApproved ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                </div>

                                <h3 className="text-2xl font-black text-gray-800 leading-tight mb-1">{driver.name}</h3>
                                <p className="text-sm text-gray-400 font-medium mb-4 break-all">{driver.email}</p>

                                <div className="w-full text-left bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 mb-6">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">📍 Registered Location</p>
                                    <p className="text-xs font-bold text-gray-600 leading-relaxed">
                                        {driver.location?.address || "No address provided"}
                                    </p>
                                </div>

                                <div className="w-full space-y-3 mb-8">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider px-2">
                                        <span className="text-gray-400">Account Status</span>
                                        <span className={driver.isApproved ? "text-green-600" : "text-orange-600"}>
                                            {driver.isApproved ? "Active" : "Pending"}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${driver.isApproved ? 'bg-green-500 w-full' : 'bg-orange-500 w-1/3'}`}
                                        ></div>
                                    </div>
                                </div>

                                {!driver.isApproved && (
                                    <button
                                        onClick={() => handleApproveDriver(driver._id)}
                                        disabled={!isReadyForApproval(driver) || processingId === driver._id}
                                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 ${isReadyForApproval(driver)
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-200'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        {processingId === driver._id ? "Activating..." : "Activate Account"}
                                    </button>
                                )}

                                {!isReadyForApproval(driver) && !driver.isApproved && (
                                    <p className="mt-3 text-[10px] text-red-500 font-black uppercase tracking-widest animate-pulse">
                                        ⚠️ Verify docs to enable
                                    </p>
                                )}

                                {driver.isApproved && (
                                    <div className="w-full py-4 bg-green-50 text-green-700 rounded-2xl font-black uppercase tracking-widest text-sm border border-green-100 shadow-sm flex items-center justify-center gap-2">
                                        <span>✅</span> Activated
                                    </div>
                                )}
                            </div>

                            {/* Documents Grid */}
                            <div className="flex-grow p-8">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                                    Verification Documents
                                    <div className="flex-grow h-px bg-gray-100"></div>
                                </h4>

                                {driver.documents.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
                                        <div className="text-4xl mb-2">📄</div>
                                        <p className="font-bold">No documents uploaded yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {driver.documents.map((doc) => (
                                            <div key={doc._id} className="group bg-white border border-gray-100 rounded-3xl p-5 hover:border-blue-200 hover:shadow-xl transition-all duration-300 flex flex-col">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide">
                                                        {doc.type}
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${doc.status === "Verified" ? "text-green-500" :
                                                        doc.status === "Rejected" ? "text-red-500" :
                                                            "text-orange-500"
                                                        }`}>
                                                        {doc.status} {doc.status === "Verified" ? "✓" : ""}
                                                    </span>
                                                </div>

                                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-5 shadow-inner">
                                                    <img
                                                        src={doc.documentUrl}
                                                        alt={doc.type}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <a
                                                        href={doc.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm"
                                                    >
                                                        Click to View 📂
                                                    </a>
                                                </div>

                                                <div className="mt-auto space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Review Notes</label>
                                                        <textarea
                                                            className="w-full border border-gray-100 bg-gray-50/50 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                                                            placeholder="Reason for rejection or verification notes..."
                                                            rows={2}
                                                            value={adminNotes[doc._id] || ""}
                                                            onChange={(e) => setAdminNotes({ ...adminNotes, [doc._id]: e.target.value })}
                                                        />
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleVerifyDoc(doc._id, "Rejected")}
                                                            disabled={processingId === doc._id}
                                                            className="flex-1 bg-red-50 text-red-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition shadow-sm active:scale-95"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifyDoc(doc._id, "Verified")}
                                                            disabled={processingId === doc._id || doc.status === "Verified"}
                                                            className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-md active:scale-95 ${doc.status === "Verified"
                                                                ? "bg-gray-100 text-gray-400 cursor-default"
                                                                : "bg-green-600 text-white hover:bg-green-700 shadow-green-100"
                                                                }`}
                                                        >
                                                            {doc.status === "Verified" ? "Verified ✓" : "Verify ✅"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
