import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../store/store";
import { fetchDriverDocuments, uploadDocument } from "../../../../slices/documentSlice";
import { ImageUpload } from "../../../components/ImageUpload/ImageUpload";

export function MyDocuments() {
    const dispatch = useDispatch<AppDispatch>();
    const auth = useSelector((state: RootState) => state.auth);
    const { driverDocuments } = useSelector((state: RootState) => state.documents);

    useEffect(() => {
        const userId = (auth?.user as any)?._id;
        if (userId) {
            dispatch(fetchDriverDocuments(userId));
        }
    }, [dispatch, auth]);

    const getDocByType = (type: string) => driverDocuments.find((d) => d.type === type);

    const handleUpload = (type: "License" | "Insurance" | "ID") => (url: string) => {
        dispatch(uploadDocument({ type, documentUrl: url }));
    };

    const DocumentCard = ({ type, label }: { type: "License" | "Insurance" | "ID"; label: string }) => {
        const doc = getDocByType(type);
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-700">{label}</span>
                    <span className={`px-2 py-1 rounded-full text-[10px] ${doc?.status === "Verified" ? "bg-green-100 text-green-700" :
                        doc?.status === "Rejected" ? "bg-red-100 text-red-700" :
                            doc?.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-500"
                        }`}>
                        {doc?.status || "Not Uploaded"}
                    </span>
                </div>

                <ImageUpload
                    onUpload={handleUpload(type)}
                    initialImage={doc?.documentUrl}
                    label={`Update ${label}`}
                />

                {doc?.adminNotes && (
                    <div className="mt-2 text-xs p-2 bg-red-50 text-red-700 rounded border border-red-100">
                        <strong>Notes:</strong> {doc.adminNotes}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p><strong>Note:</strong> You must upload and verify your License, Insurance, and ID to be approved as a driver.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DocumentCard type="License" label="Driver's License" />
                <DocumentCard type="Insurance" label="Insurance Policy" />
                <DocumentCard type="ID" label="National ID / Passport" />
            </div>
        </div>
    );
}
