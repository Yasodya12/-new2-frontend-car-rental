import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../store/store.ts";
import { fetchDriverDocuments, clearDriverDocuments, verifyDocument } from "../../../../slices/documentSlice.ts";
import { approveDriver, getAllDrivers } from "../../../../slices/driverSlices.ts";
import { getAllUsers } from "../../../../slices/UserSlices.ts";
import type { UserData } from "../../../../Model/userData.ts";
import type { PopulatedTripDTO } from "../../../../Model/trip.data.ts";
import type { DriverDocumentData } from "../../../../Model/DriverDocumentData.ts";

interface UserDetailsModalProps {
    user: UserData;
    trips: PopulatedTripDTO[];
    onClose: () => void;
}

export function UserDetailsModal({ user, trips, onClose }: UserDetailsModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { driverDocuments } = useSelector((state: RootState) => state.documents);
    const { role: loggedInRole } = useSelector((state: RootState) => state.auth);
    const [docAdminNotes, setDocAdminNotes] = useState<{ [key: string]: string }>({});
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    useEffect(() => {
        if (user.role === 'driver' && user._id) {
            dispatch(fetchDriverDocuments(user._id));
        }
        return () => {
            dispatch(clearDriverDocuments());
        };
    }, [dispatch, user._id, user.role]);

    const mandatoryTypes = ["License", "ID"];
    const verifiedDocs = driverDocuments.filter((d: DriverDocumentData) => d.status === 'Verified');
    const pendingMandatory = driverDocuments.filter((d: DriverDocumentData) =>
        mandatoryTypes.includes(d.type) && d.status === 'Pending'
    );

    const isReadyForApproval = mandatoryTypes.every(type =>
        verifiedDocs.some((d: DriverDocumentData) => d.type === type)
    );

    const handleVerifyAll = async () => {
        if (pendingMandatory.length === 0) return;
        setVerifyingId("bulk");
        try {
            await Promise.all(pendingMandatory.map(doc =>
                dispatch(verifyDocument({
                    id: doc._id!,
                    status: 'Verified',
                    adminNotes: "Quick approval by administrator"
                })).unwrap()
            ));
            alert("All pending mandatory documents verified! ✅");
        } catch (err) {
            alert("Failed to verify some documents");
        } finally {
            setVerifyingId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold">User Details</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200 text-3xl font-bold">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* User Profile Section */}
                    <div className="bg-gray-50 p-6 rounded-lg flex items-start gap-6 font-outfit">
                        <div className="flex-shrink-0">
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage.startsWith("http")
                                        ? user.profileImage
                                        : `http://localhost:3000/uploads/profile/${user.profileImage}`}
                                    alt={user.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-4xl border-4 border-white shadow-md">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-gray-800">{user.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'driver' ? 'bg-green-100 text-green-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                    {user.role}
                                </span>
                                {user.role === 'driver' && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.isApproved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                        }`}>
                                        {user.isApproved ? 'Approved' : 'Pending Approval'}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 border-t pt-4 border-gray-100">
                                <div>
                                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">Email</p>
                                    <p className="font-semibold text-gray-700">{user.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">Contact</p>
                                    <p className="font-semibold text-gray-700">{user.contactNumber || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">NIC</p>
                                    <p className="font-semibold text-gray-700">{user.nic || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">Date of Birth</p>
                                    <p className="font-semibold text-gray-700">
                                        {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">Gender</p>
                                    <p className="font-semibold text-gray-700">{user.gender || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">User ID</p>
                                    <p className="font-mono text-xs text-gray-400">{user._id}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-wider">Registered Location</p>
                                    <p className="font-semibold text-gray-700">{user.location?.address || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Driver Documents Section - Admin Only */}
                    {user.role === 'driver' && loggedInRole === 'admin' && (
                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <span>🪪</span> Compliance Documents
                                </h3>
                                <div className="flex gap-2">
                                    {mandatoryTypes.map(type => {
                                        const isVerified = verifiedDocs.some(d => d.type === type);
                                        return (
                                            <div key={type} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${isVerified ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400'
                                                }`}>
                                                {isVerified ? '✓' : '○'} {type}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {pendingMandatory.length > 0 && (
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">⚡</span>
                                        <div>
                                            <p className="text-sm font-bold text-blue-800">Ready to speed things up?</p>
                                            <p className="text-[10px] text-blue-600 font-medium">You have {pendingMandatory.length} pending mandatory docs.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleVerifyAll}
                                        disabled={!!verifyingId}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:bg-gray-300"
                                    >
                                        {verifyingId === "bulk" ? "Verifying..." : "Verify All Pending"}
                                    </button>
                                </div>
                            )}

                            {driverDocuments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {driverDocuments.map((doc: DriverDocumentData) => (
                                        <div key={doc._id} className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border-gray-100">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{doc.type}</h4>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${doc.status === 'Verified' ? 'bg-green-100 text-green-800' :
                                                        doc.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                                <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-bold hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">
                                                    Open Link
                                                </a>
                                            </div>

                                            <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-gray-100 border relative group border-gray-100 shadow-inner">
                                                <img src={doc.documentUrl} alt={doc.type} className="w-full h-full object-cover" />
                                            </div>

                                            {doc.status === 'Pending' && (
                                                <div className="space-y-3 pt-3 border-t border-gray-100">
                                                    <textarea
                                                        placeholder="Add clarification notes..."
                                                        className="w-full text-xs p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50"
                                                        rows={2}
                                                        value={doc._id ? (docAdminNotes[doc._id] || "") : ""}
                                                        onChange={(e) => {
                                                            if (doc._id) {
                                                                setDocAdminNotes({ ...docAdminNotes, [doc._id]: e.target.value });
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (doc._id) {
                                                                    setVerifyingId(doc._id);
                                                                    await dispatch(verifyDocument({ id: doc._id, status: 'Verified', adminNotes: docAdminNotes[doc._id] }));
                                                                    setVerifyingId(null);
                                                                }
                                                            }}
                                                            disabled={!!verifyingId}
                                                            className="flex-1 bg-green-600 text-white text-xs py-2.5 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-300 shadow-md transition-all active:scale-95"
                                                        >
                                                            Approve {doc.type}
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (doc._id) {
                                                                    setVerifyingId(doc._id);
                                                                    await dispatch(verifyDocument({ id: doc._id, status: 'Rejected', adminNotes: docAdminNotes[doc._id] }));
                                                                    setVerifyingId(null);
                                                                }
                                                            }}
                                                            disabled={!!verifyingId}
                                                            className="flex-1 bg-red-600 text-white text-xs py-2.5 rounded-xl font-bold hover:bg-red-700 disabled:bg-gray-300 shadow-md transition-all active:scale-95"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {doc.adminNotes && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-dashed border-gray-200">
                                                    <div className="font-bold text-gray-400 uppercase text-[10px] mb-1">Admin Feedback</div>
                                                    {doc.adminNotes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                                    <div className="text-4xl mb-2">📁</div>
                                    <p className="font-bold text-sm text-gray-500">No documents found.</p>
                                    <p className="text-xs text-gray-400">Driver needs to upload ID, License, and Insurance.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Associated Trips Section */}
                    <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Trip Activity</h3>
                        <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-500 text-sm border border-gray-100">
                            {trips.length > 0 ? (
                                <p className="font-bold text-gray-600 text-lg">{trips.length} <span className="text-gray-400 text-sm font-medium">associated trips found.</span></p>
                            ) : (
                                <p className="italic">No trip history recorded for this user yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-6 border-t rounded-b-lg flex justify-between items-center z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                    <div>
                        {user.role === 'driver' && !user.isApproved && loggedInRole === 'admin' && (
                            <div className="flex flex-col items-start gap-1">
                                <button
                                    onClick={async () => {
                                        if (user._id) {
                                            try {
                                                await dispatch(approveDriver(user._id)).unwrap();
                                                alert("Driver account activated successfully! 🎉");
                                                dispatch(getAllUsers());
                                                dispatch(getAllDrivers());
                                                onClose();
                                            } catch (err: any) {
                                                alert(err.message || "Failed to activate driver account");
                                            }
                                        }
                                    }}
                                    disabled={!isReadyForApproval}
                                    className={`px-10 py-4 rounded-2xl font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${isReadyForApproval
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-200'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                        }`}
                                >
                                    Activate Driver
                                </button>
                                {!isReadyForApproval && (
                                    <span className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-2 px-1 animate-pulse">
                                        ⚠️ Verify documents to activate
                                    </span>
                                )}
                            </div>
                        )}
                        {user.role === 'driver' && user.isApproved && (
                            <div className="bg-green-100 text-green-800 px-6 py-3 rounded-2xl font-black uppercase tracking-wide flex items-center gap-3 shadow-inner">
                                <span className="text-xl">✅</span> Account Activated
                            </div>
                        )}
                        {user.role !== 'driver' && (
                            <div className="text-gray-400 font-bold uppercase text-sm tracking-widest">
                                Standard User Account
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
