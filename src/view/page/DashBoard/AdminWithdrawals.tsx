import { useEffect, useState } from 'react';
import { backendApi } from '../../../api';
import { FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaClock, FaUniversity, FaSearch, FaFilter } from 'react-icons/fa';

interface Withdrawal {
    _id: string;
    driverId: {
        _id: string;
        name: string;
        email: string;
        profileImage?: string;
    };
    amount: number;
    method: 'Cash' | 'Bank Transfer';
    status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
    bankDetails?: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
    };
    requestedAt: string;
    processedAt?: string;
    processedBy?: {
        name: string;
    };
    rejectionReason?: string;
}

export function AdminWithdrawals() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        try {
            const res = await backendApi.get('/api/v1/withdrawals');
            setWithdrawals(res.data);
        } catch (err) {
            console.error('Failed to fetch withdrawals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            await backendApi.patch(`/api/v1/withdrawals/${id}/approve`);
            fetchWithdrawals();
        } catch (err) {
            console.error('Failed to approve withdrawal:', err);
            alert('Failed to approve withdrawal');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        setProcessing(id);
        try {
            await backendApi.patch(`/api/v1/withdrawals/${id}/reject`, { reason: rejectionReason });
            setShowRejectModal(null);
            setRejectionReason('');
            fetchWithdrawals();
        } catch (err) {
            console.error('Failed to reject withdrawal:', err);
            alert('Failed to reject withdrawal');
        } finally {
            setProcessing(null);
        }
    };

    const handleComplete = async (id: string) => {
        setProcessing(id);
        try {
            await backendApi.patch(`/api/v1/withdrawals/${id}/complete`);
            fetchWithdrawals();
        } catch (err) {
            console.error('Failed to complete withdrawal:', err);
            alert('Failed to complete withdrawal');
        } finally {
            setProcessing(null);
        }
    };

    const filteredWithdrawals = withdrawals.filter(w => {
        const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
        const matchesSearch = searchTerm === '' ||
            w.driverId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.driverId.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-warning/20 text-warning border-warning/40';
            case 'Approved': return 'bg-primary/20 text-primary border-primary/40';
            case 'Completed': return 'bg-accent/20 text-accent border-accent/40';
            case 'Rejected': return 'bg-danger/20 text-danger border-danger/40';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending': return <FaClock />;
            case 'Approved': return <FaCheckCircle />;
            case 'Completed': return <FaCheckCircle />;
            case 'Rejected': return <FaTimesCircle />;
            default: return <FaClock />;
        }
    };

    const totalPending = withdrawals.filter(w => w.status === 'Pending').reduce((sum, w) => sum + w.amount, 0);
    const totalApproved = withdrawals.filter(w => w.status === 'Approved').reduce((sum, w) => sum + w.amount, 0);
    const totalCompleted = withdrawals.filter(w => w.status === 'Completed').reduce((sum, w) => sum + w.amount, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-muted">Loading withdrawals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-dark relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 py-8 px-4 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-5xl lg:text-6xl font-black text-text-light mb-3 leading-tight">
                            Withdrawal Requests 💰
                        </h1>
                        <p className="text-lg text-text-muted">Manage driver payout requests</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div className="bg-card-dark rounded-2xl border border-warning/30 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center">
                                    <FaClock className="text-warning text-2xl" />
                                </div>
                                <div>
                                    <p className="text-text-muted text-sm uppercase">Pending</p>
                                    <p className="text-2xl font-black text-warning">Rs. {totalPending.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-card-dark rounded-2xl border border-primary/30 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <FaCheckCircle className="text-primary text-2xl" />
                                </div>
                                <div>
                                    <p className="text-text-muted text-sm uppercase">Approved</p>
                                    <p className="text-2xl font-black text-primary">Rs. {totalApproved.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-card-dark rounded-2xl border border-accent/30 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
                                    <FaMoneyBillWave className="text-accent text-2xl" />
                                </div>
                                <div>
                                    <p className="text-text-muted text-sm uppercase">Paid Out</p>
                                    <p className="text-2xl font-black text-accent">Rs. {totalCompleted.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-card-dark rounded-2xl border border-border-dark p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search by driver name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl pl-12 pr-4 py-3 text-text-light placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <FaFilter className="text-text-muted" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-text-light focus:border-accent focus:outline-none transition-colors"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Withdrawals List */}
                    <div className="bg-card-dark rounded-3xl border border-border-dark overflow-hidden">
                        {filteredWithdrawals.length === 0 ? (
                            <div className="text-center py-16">
                                <FaMoneyBillWave className="text-6xl text-text-muted mx-auto mb-4" />
                                <p className="text-text-muted text-lg">No withdrawal requests found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-dark">
                                {filteredWithdrawals.map((withdrawal) => (
                                    <div key={withdrawal._id} className="p-6 hover:bg-bg-dark/30 transition-colors">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                            {/* Driver Info */}
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                                                    {withdrawal.driverId.profileImage ? (
                                                        <img
                                                            src={withdrawal.driverId.profileImage.startsWith('http')
                                                                ? withdrawal.driverId.profileImage
                                                                : `http://localhost:3000/uploads/profile/${withdrawal.driverId.profileImage}`}
                                                            alt={withdrawal.driverId.name}
                                                            className="w-full h-full rounded-xl object-cover"
                                                        />
                                                    ) : (
                                                        withdrawal.driverId.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-light text-lg">{withdrawal.driverId.name}</p>
                                                    <p className="text-text-muted text-sm">{withdrawal.driverId.email}</p>
                                                </div>
                                            </div>

                                            {/* Amount & Method */}
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-accent">Rs. {withdrawal.amount.toLocaleString()}</p>
                                                    <div className="flex items-center gap-2 text-text-muted text-sm justify-end">
                                                        {withdrawal.method === 'Bank Transfer' ? <FaUniversity /> : <FaMoneyBillWave />}
                                                        <span>{withdrawal.method}</span>
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <span className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2 ${getStatusStyle(withdrawal.status)}`}>
                                                    {getStatusIcon(withdrawal.status)}
                                                    {withdrawal.status}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                {withdrawal.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(withdrawal._id)}
                                                            disabled={processing === withdrawal._id}
                                                            className="bg-accent hover:bg-accent/90 text-bg-dark font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            <FaCheckCircle />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setShowRejectModal(withdrawal._id)}
                                                            disabled={processing === withdrawal._id}
                                                            className="bg-danger hover:bg-danger/90 text-white font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            <FaTimesCircle />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {withdrawal.status === 'Approved' && (
                                                    <button
                                                        onClick={() => handleComplete(withdrawal._id)}
                                                        disabled={processing === withdrawal._id}
                                                        className="bg-accent hover:bg-accent/90 text-bg-dark font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        <FaMoneyBillWave />
                                                        Mark as Paid
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bank Details */}
                                        {withdrawal.method === 'Bank Transfer' && withdrawal.bankDetails && (
                                            <div className="mt-4 bg-bg-dark/50 rounded-xl p-4 border border-border-dark">
                                                <p className="text-text-muted text-sm font-bold mb-2">Bank Details</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-text-muted">Bank</p>
                                                        <p className="text-text-light font-medium">{withdrawal.bankDetails.bankName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-text-muted">Account Number</p>
                                                        <p className="text-text-light font-medium">{withdrawal.bankDetails.accountNumber}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-text-muted">Account Holder</p>
                                                        <p className="text-text-light font-medium">{withdrawal.bankDetails.accountHolderName}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Rejection Reason */}
                                        {withdrawal.status === 'Rejected' && withdrawal.rejectionReason && (
                                            <div className="mt-4 bg-danger/10 rounded-xl p-4 border border-danger/30">
                                                <p className="text-danger text-sm">
                                                    <strong>Rejection Reason:</strong> {withdrawal.rejectionReason}
                                                </p>
                                            </div>
                                        )}

                                        {/* Meta Info */}
                                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
                                            <span>Requested: {new Date(withdrawal.requestedAt).toLocaleString()}</span>
                                            {withdrawal.processedAt && (
                                                <span>Processed: {new Date(withdrawal.processedAt).toLocaleString()}</span>
                                            )}
                                            {withdrawal.processedBy && (
                                                <span>By: {withdrawal.processedBy.name}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card-dark rounded-2xl border border-border-dark w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-text-light mb-4">Reject Withdrawal</h3>
                        <p className="text-text-muted mb-4">Please provide a reason for rejection:</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-text-light placeholder-text-muted focus:border-accent focus:outline-none transition-colors resize-none h-32"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectionReason('');
                                }}
                                className="flex-1 bg-bg-dark border border-border-dark text-text-light font-bold py-3 rounded-xl hover:bg-bg-dark/50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReject(showRejectModal)}
                                disabled={!rejectionReason.trim() || processing === showRejectModal}
                                className="flex-1 bg-danger text-white font-bold py-3 rounded-xl hover:bg-danger/90 transition-colors disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
