import { useEffect, useState } from "react";
import { backendApi } from "../../../api";

interface Promotion {
    _id: string;
    code: string;
    discountType: "Percentage" | "Fixed";
    value: number;
    maxDiscount: number;
    minTripAmount: number;
    expiryDate: string;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
}

export function Promotions() {
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        discountType: "Percentage" as "Percentage" | "Fixed",
        value: 0,
        maxDiscount: 0,
        minTripAmount: 0,
        expiryDate: "",
        usageLimit: 100
    });

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            setUserRole(decoded.role);
        }
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            const res = await backendApi.get("/api/v1/promotions");
            setPromos(res.data);
        } catch (error) {
            console.error("Error fetching promotions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isUpdating && selectedPromoId) {
                await backendApi.put(`/api/v1/promotions/${selectedPromoId}`, formData);
                alert("Promo code updated successfully!");
            } else {
                await backendApi.post("/api/v1/promotions", formData);
                alert("Promo code created successfully!");
            }
            handleCloseModal();
            fetchPromos();
        } catch (error: any) {
            alert(error.response?.data?.message || "Operation failed");
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsUpdating(false);
        setSelectedPromoId(null);
        setFormData({
            code: "",
            discountType: "Percentage",
            value: 0,
            maxDiscount: 0,
            minTripAmount: 0,
            expiryDate: "",
            usageLimit: 100
        });
    };

    const handleEdit = (promo: Promotion) => {
        setFormData({
            code: promo.code,
            discountType: promo.discountType,
            value: promo.value,
            maxDiscount: promo.maxDiscount,
            minTripAmount: promo.minTripAmount,
            expiryDate: promo.expiryDate.split('T')[0],
            usageLimit: promo.usageLimit
        });
        setIsUpdating(true);
        setSelectedPromoId(promo._id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this promo code?")) {
            try {
                await backendApi.delete(`/api/v1/promotions/${id}`);
                fetchPromos();
            } catch (error) {
                alert("Failed to delete promo code");
            }
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await backendApi.patch(`/api/v1/promotions/${id}/toggle`);
            fetchPromos();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    if (loading) {
        return <div className="text-center p-12">Loading promotions...</div>;
    }

    if (userRole !== 'admin') {
        return <div className="p-12 text-center text-red-600 font-bold">Access Denied: Only administrators can view this page.</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-blue-700">Promotions & Coupons 🏷️</h1>
                {userRole === 'admin' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md font-bold transition flex items-center gap-2"
                    >
                        <span>➕</span> Create New Coupon
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center p-12">Loading promotions...</div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-blue-600 text-white uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Discount</th>
                                <th className="px-6 py-4">Min Amount</th>
                                <th className="px-6 py-4">Expiry</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                {userRole === 'admin' && <th className="px-6 py-4 text-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {promos.map((promo) => (
                                <tr key={promo._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-bold text-gray-900">{promo.code}</td>
                                    <td className="px-6 py-4">
                                        {promo.discountType === "Percentage" ? `${promo.value}%` : `Rs. ${promo.value}`}
                                        {promo.maxDiscount > 0 && ` (Max Rs. ${promo.maxDiscount})`}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">Rs. {promo.minTripAmount}</td>
                                    <td className="px-6 py-4 text-gray-600 text-xs">
                                        {new Date(promo.expiryDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-full"
                                                    style={{ width: `${(promo.usedCount / promo.usageLimit) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] text-gray-500">{promo.usedCount} / {promo.usageLimit}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${promo.isActive && new Date(promo.expiryDate) > new Date()
                                            ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                            }`}>
                                            {promo.isActive && new Date(promo.expiryDate) > new Date() ? 'ACTIVE' : 'EXPIRED/INACTIVE'}
                                        </span>
                                    </td>
                                    {userRole === 'admin' && (
                                        <td className="px-6 py-4 flex justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(promo)}
                                                className="text-blue-600 hover:text-blue-800 font-bold text-[10px] border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
                                            >
                                                EDIT
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(promo._id)}
                                                className={`text-[10px] font-bold px-2 py-1 rounded border ${promo.isActive ? 'border-orange-500 text-orange-600 hover:bg-orange-50' : 'border-green-500 text-green-600 hover:bg-green-50'}`}
                                            >
                                                {promo.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(promo._id)}
                                                className="text-red-500 hover:text-red-700 font-bold text-[10px] border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                                            >
                                                DELETE
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {promos.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                                        No promo codes found. Click "Create New Coupon" to get started!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Coupon Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-blue-600 text-white p-5 flex justify-between items-center rounded-t-xl">
                            <h2 className="text-xl font-bold">{isUpdating ? "Edit Coupon" : "Create New Coupon"}</h2>
                            <button onClick={handleCloseModal} className="text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code (Uppercase)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                                        placeholder="E.G. SUMMER2024"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                                    >
                                        <option value="Percentage">Percentage (%)</option>
                                        <option value="Fixed">Fixed Amount (Rs.)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (0 for no limit)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.maxDiscount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Trip Amount (Rs.)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.minTripAmount}
                                        onChange={(e) => setFormData({ ...formData, minTripAmount: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="pt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-md"
                                >
                                    {isUpdating ? "Save Changes" : "Create Coupon"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
