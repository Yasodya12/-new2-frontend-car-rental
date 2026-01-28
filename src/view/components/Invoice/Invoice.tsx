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

    if (loading) return (
        <div className="p-12 text-center text-text-muted">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-bold text-xs uppercase tracking-widest opacity-60">Retrieving Fiscal Stream...</p>
        </div>
    );

    if (!payment) {
        return (
            <div className="bg-bg-dark/50 p-12 rounded-[2.5rem] border border-border-dark border-dashed text-center">
                <div className="w-20 h-20 bg-card-dark rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-text-muted/20">
                    <span className="text-4xl">📄</span>
                </div>
                <p className="text-text-muted mb-8 font-bold text-sm tracking-tight opacity-60">No Fiscal Record Generated</p>
                {currentUserRole === 'driver' && (
                    <button
                        onClick={handleGenerateInvoice}
                        className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
                    >
                        Generate Operational Receipt
                    </button>
                )}
            </div>
        );
    }

    const isPaid = payment.status === 'Paid';
    const tripDetails = typeof payment.tripId === 'object' ? (payment.tripId as TripData) : null;

    return (
        <div className={`max-w-md mx-auto bg-card-dark rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-border-dark relative transition-all ${isPaid ? 'ring-2 ring-accent/10' : 'ring-2 ring-primary/10'}`}>
            {/* Header Identity */}
            <div className={`p-6 md:p-10 text-center relative overflow-hidden ${isPaid ? 'bg-accent/5' : 'bg-primary/5'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-card-dark rounded-full -mr-16 -mt-16 opacity-50"></div>
                <h2 className="text-xl md:text-2xl font-black text-text-light tracking-tight uppercase tracking-widest mb-1">{isPaid ? 'Payment Receipt' : 'Service Invoice'}</h2>
                <p className="text-[9px] text-text-muted font-black tracking-[0.2em] mb-4 opacity-40">REF: {payment._id?.slice(-8).toUpperCase()}</p>

                <div className={`inline-flex items-center gap-2 px-6 py-1.5 rounded-full text-[9px] font-black tracking-widest shadow-sm ${isPaid ? 'bg-accent text-white' : 'bg-primary text-white'}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    {payment.status.toUpperCase()}
                </div>
            </div>

            {/* Core Bill Details */}
            <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                {/* Tactical Route HUD */}
                {tripDetails && (
                    <div className="bg-bg-dark/50 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-border-dark space-y-3 md:space-y-4 shadow-inner">
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                            <div>
                                <p className="text-[8px] text-text-muted font-black uppercase tracking-widest mb-0.5 opacity-60">Origin</p>
                                <p className="text-sm font-bold text-text-light leading-tight">{tripDetails.startLocation}</p>
                            </div>
                        </div>
                        <div className="w-px h-4 bg-border-dark ml-1 opacity-50 border-l border-dashed"></div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-danger mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                            <div>
                                <p className="text-[8px] text-text-muted font-black uppercase tracking-widest mb-0.5 opacity-60">Termination</p>
                                <p className="text-sm font-bold text-text-light leading-tight">{tripDetails.endLocation}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 md:gap-6 pb-6 border-b border-border-dark">
                    <div>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">Operational ID</p>
                        <p className="font-mono text-xs font-black text-text-light">
                            #{tripDetails?._id?.slice(-8) || (typeof payment.tripId === 'string' ? payment.tripId.slice(-8) : 'N/A')}
                        </p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">Timestamp</p>
                        <p className="text-xs font-bold text-text-light">
                            {new Date(payment.createdAt || "").toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">Method</p>
                        <p className="text-xs font-bold text-text-light uppercase tracking-widest">{payment.method}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">Telemetry</p>
                        <p className="text-xs font-bold text-text-light">{tripDetails?.distance || "0"} KM</p>
                    </div>
                </div>

                {/* Fiscal Wrap */}
                <div className="space-y-4">
                    {tripDetails?.discountAmount && tripDetails.discountAmount > 0 ? (
                        <div className="space-y-2 pb-4 border-b border-border-dark border-dashed">
                            <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-text-muted">
                                <span>Sub-Total</span>
                                <span>LKR {(payment.amount + tripDetails.discountAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-accent">
                                <span className="flex items-center gap-2">Promo ({tripDetails.promoCode})</span>
                                <span>- LKR {tripDetails.discountAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex justify-between items-end bg-bg-dark/30 p-4 rounded-2xl border border-border-dark/50 shadow-sm">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">Total Settlement</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] font-black text-text-muted uppercase">LKR</span>
                                <span className={`text-3xl font-black ${isPaid ? 'text-accent' : 'text-primary'}`}>
                                    {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Block */}
            <div className="p-6 md:p-10 bg-bg-dark/30 border-t border-border-dark">
                {!isPaid && currentUserRole === 'driver' && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between bg-card-dark p-3 rounded-xl border border-border-dark shadow-sm">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest px-2">Vector:</span>
                            <select
                                value={selectedMethod}
                                onChange={(e) => setSelectedMethod(e.target.value as any)}
                                className="text-[11px] font-black text-text-light bg-transparent border-none focus:ring-0 cursor-pointer outline-none uppercase tracking-widest"
                            >
                                <option value="Cash">Cash Settlement</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCollectPayment}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-[10px] uppercase tracking-[0.2em]"
                        >
                            Finalize {selectedMethod} Collection
                        </button>
                    </div>
                )}

                {isPaid && (
                    <button
                        onClick={() => window.print()}
                        className="w-full bg-card-dark border border-border-dark text-text-light font-black py-4 px-6 rounded-xl hover:bg-bg-dark transition shadow-sm text-[9px] uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3"
                    >
                        <span>🖨️</span>
                        <span>Download Physical Manifest</span>
                    </button>
                )}
            </div>
        </div>
    );
}
