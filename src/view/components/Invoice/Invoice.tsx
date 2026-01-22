import { useState, useEffect } from "react";
import { backendApi } from "../../../api";
import type { PaymentData } from "../../../Model/PaymentData";
import type { TripData } from "../../../Model/trip.data";

interface InvoiceProps {
    tripId: string;
    currentUserRole: string | null;
    onPaymentComplete?: () => void;
}

export function Invoice({ tripId, currentUserRole, onPaymentComplete }: InvoiceProps) {
    const [payment, setPayment] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPayment = async () => {
        try {
            const res = await backendApi.get(`/api/v1/payments/trip/${tripId}`);
            if (res.data) {
                setPayment(res.data);
            }
        } catch (error) {
            console.error("Error fetching invoice", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayment();
    }, [tripId]);

    const [selectedMethod, setSelectedMethod] = useState<'Cash' | 'Bank Transfer'>('Cash');

    const handleCollectPayment = async () => {
        if (!payment || !payment._id) return;

        if (confirm(`Confirm that you have collected the ${selectedMethod} payment?`)) {
            try {
                const res = await backendApi.put(`/api/v1/payments/${payment._id}/pay`, {
                    collectedBy: localStorage.getItem("userId"), // Current user ID
                    method: selectedMethod
                });
                if (res.status === 200) {
                    alert("Payment Collected & Receipt Sent!");
                    setPayment(res.data);
                    if (onPaymentComplete) onPaymentComplete();
                }
            } catch (error) {
                alert("Failed to update payment status");
            }
        }
    };

    const handleGenerateInvoice = async () => {
        try {
            setLoading(true);
            const tripRes = await backendApi.get(`/api/v1/trips/${tripId}`);
            const trip = tripRes.data;

            if (trip) {
                const customerId = trip.customerId && typeof trip.customerId === 'object'
                    ? trip.customerId._id
                    : trip.customerId;

                const res = await backendApi.post("/api/v1/payments/generate", {
                    tripId: trip._id,
                    userId: customerId,
                    amount: trip.price
                });

                if (res.status === 201) {
                    setPayment(res.data);
                }
            }
        } catch (error) {
            console.error("Error generating invoice manually", error);
            alert("Failed to generate invoice");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Invoice Details...</div>;

    if (!payment) {
        return (
            <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <p className="text-gray-500 mb-4 font-medium">No Invoice Generated</p>
                {currentUserRole === 'driver' && (
                    <button
                        onClick={handleGenerateInvoice}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full shadow-md transition transform hover:scale-105"
                    >
                        Generate Invoice Now
                    </button>
                )}
            </div>
        );
    }

    const isPaid = payment.status === 'Paid';
    // Access populated trip details if available
    const tripDetails = typeof payment.tripId === 'object' ? (payment.tripId as TripData) : null;

    return (
        <div className={`max-w-md mx-auto bg-white rounded-xl shadow-lg run-animation overflow-hidden border-t-8 ${isPaid ? 'border-green-500' : 'border-blue-500'}`}>
            {/* Header */}
            <div className={`p-6 text-center ${isPaid ? 'bg-green-50' : 'bg-blue-50'}`}>
                <h2 className="text-2xl font-bold text-gray-800 tracking-wide">{isPaid ? 'PAYMENT RECEIPT' : 'INVOICE'}</h2>
                <p className="text-sm text-gray-500 mt-1">ID: #{payment._id?.slice(-6).toUpperCase()}</p>
                <div className={`mt-3 inline-block px-4 py-1 rounded-full text-sm font-bold tracking-wide shadow-sm ${isPaid ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {payment.status.toUpperCase()}
                </div>
            </div>

            {/* Bill Details */}
            <div className="p-6 space-y-4">
                {/* Trip Route */}
                {tripDetails && (
                    <div className="mb-6 relative pl-4 border-l-2 border-gray-300 space-y-4">
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white"></div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">From</p>
                            <p className="text-gray-800 font-medium">{tripDetails.startLocation}</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white"></div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">To</p>
                            <p className="text-gray-800 font-medium">{tripDetails.endLocation}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                    <div className="col-span-2 border-b border-gray-200 pb-2 mb-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wide">Trip ID</p>
                        <p className="font-mono font-bold text-gray-700">
                            {tripDetails?._id || (typeof payment.tripId === 'string' ? payment.tripId : 'N/A')}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-semibold text-gray-800">
                            {new Date(payment.createdAt || "").toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Distance</p>
                        <p className="font-semibold text-gray-800">
                            {tripDetails?.distance || "N/A"}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Method</p>
                        <p className="font-semibold text-gray-800">{payment.method}</p>
                    </div>
                    {isPaid && payment.collectedAt && (
                        <div>
                            <p className="text-gray-500">Paid On</p>
                            <p className="font-semibold text-gray-800">
                                {new Date(payment.collectedAt).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Total */}
                <div className="border-t border-dashed border-gray-300 pt-4 mt-2 space-y-2">
                    {tripDetails?.discountAmount && tripDetails.discountAmount > 0 ? (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-gray-700 font-medium">LKR {(payment.amount + tripDetails.discountAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    Discount 🏷️ ({tripDetails.promoCode})
                                </span>
                                <span className="text-green-600 font-medium">- LKR {tripDetails.discountAmount.toFixed(2)}</span>
                            </div>
                        </>
                    ) : null}
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-gray-600 font-bold">Total Amount</span>
                        <span className="text-3xl font-bold text-gray-900">
                            LKR <span className={`${isPaid ? 'text-green-600' : 'text-blue-600'}`}>{payment.amount.toFixed(2)}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
                {!isPaid && currentUserRole === 'driver' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                            <select
                                value={selectedMethod}
                                onChange={(e) => setSelectedMethod(e.target.value as any)}
                                className="text-sm font-bold text-gray-800 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                            >
                                <option value="Cash">Cash 💵</option>
                                <option value="Bank Transfer">Bank Transfer 🏦</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCollectPayment}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            Confirm {selectedMethod} Collection
                        </button>
                    </div>
                )}

                {!isPaid && currentUserRole === 'customer' && (
                    <div className="text-center p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                        ⚠️ Please settle the <strong>LKR {payment.amount}</strong> payment with your driver directly.
                    </div>
                )}

                {isPaid && (
                    <button
                        onClick={() => window.print()}
                        className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition shadow-sm text-sm"
                    >
                        Download / Print Receipt 🖨️
                    </button>
                )}
            </div>
        </div>
    );
}
