import { useState } from 'react';
import { FaTimes, FaMoneyBillWave, FaUniversity, FaSpinner } from 'react-icons/fa';
import { backendApi } from '../../../../api';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletBalance: number;
    onSuccess: () => void;
}

export function WithdrawalModal({ isOpen, onClose, walletBalance, onSuccess }: WithdrawalModalProps) {
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<'Cash' | 'Bank Transfer'>('Cash');
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        accountNumber: '',
        accountHolderName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (withdrawAmount > walletBalance) {
            setError(`Amount exceeds your balance of Rs. ${walletBalance.toLocaleString()}`);
            return;
        }

        if (method === 'Bank Transfer') {
            if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountHolderName) {
                setError('Please fill in all bank details');
                return;
            }
        }

        setLoading(true);
        try {
            await backendApi.post('/api/v1/withdrawals', {
                amount: withdrawAmount,
                method,
                bankDetails: method === 'Bank Transfer' ? bankDetails : undefined
            });

            onSuccess();
            onClose();
            // Reset form
            setAmount('');
            setMethod('Cash');
            setBankDetails({ bankName: '', accountNumber: '', accountHolderName: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit withdrawal request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card-dark rounded-3xl border border-border-dark w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-accent/20 to-primary/20 p-6 border-b border-border-dark">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                                <FaMoneyBillWave className="text-accent text-xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-light">Request Withdrawal</h2>
                                <p className="text-sm text-text-muted">Available: Rs. {walletBalance.toLocaleString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-bg-dark/50 flex items-center justify-center text-text-muted hover:text-text-light hover:bg-bg-dark transition-all"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">
                            Amount (Rs.)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-text-light placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
                            max={walletBalance}
                            min={1}
                        />
                        <button
                            type="button"
                            onClick={() => setAmount(walletBalance.toString())}
                            className="mt-2 text-xs text-accent hover:underline"
                        >
                            Withdraw full balance
                        </button>
                    </div>

                    {/* Method */}
                    <div>
                        <label className="block text-sm font-bold text-text-muted mb-3 uppercase tracking-wider">
                            Withdrawal Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMethod('Cash')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'Cash'
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-border-dark bg-bg-dark text-text-muted hover:border-accent/50'
                                    }`}
                            >
                                <FaMoneyBillWave className="text-2xl" />
                                <span className="font-bold text-sm">Cash</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('Bank Transfer')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'Bank Transfer'
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-border-dark bg-bg-dark text-text-muted hover:border-accent/50'
                                    }`}
                            >
                                <FaUniversity className="text-2xl" />
                                <span className="font-bold text-sm">Bank Transfer</span>
                            </button>
                        </div>
                    </div>

                    {/* Bank Details (conditional) */}
                    {method === 'Bank Transfer' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-bold text-text-muted mb-2">Bank Name</label>
                                <input
                                    type="text"
                                    value={bankDetails.bankName}
                                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                    placeholder="e.g., Bank of Ceylon"
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-text-light placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-muted mb-2">Account Number</label>
                                <input
                                    type="text"
                                    value={bankDetails.accountNumber}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                    placeholder="Enter account number"
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-text-light placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-muted mb-2">Account Holder Name</label>
                                <input
                                    type="text"
                                    value={bankDetails.accountHolderName}
                                    onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                                    placeholder="Name as on account"
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-text-light placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-danger text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent/90 text-bg-dark font-bold py-4 rounded-xl shadow-lg shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <FaMoneyBillWave />
                                Request Withdrawal
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
