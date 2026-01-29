import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../../store/store";
import type { rootReducerState } from "../../../slices/RootReducers";
import { createTicket, fetchUserTickets, fetchAllTickets, resolveTicket } from "../../../slices/ticketSlice";
import type { TicketData } from "../../../Model/TicketData";

export function HelpCenter() {
    const dispatch = useDispatch<AppDispatch>();
    const { userTickets, tickets, loading } = useSelector((state: rootReducerState) => state.tickets);
    const { role } = useSelector((state: rootReducerState) => state.auth);
    const [showModal, setShowModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
    const [adminResponse, setAdminResponse] = useState("");
    const [formData, setFormData] = useState<TicketData>({
        subject: "",
        description: "",
        priority: "Medium",
        status: "Open",
        userId: "" // Will be handled by backend from token
    });

    useEffect(() => {
        if (role === 'admin') {
            dispatch(fetchAllTickets());
        } else {
            dispatch(fetchUserTickets());
        }
    }, [dispatch, role]);

    const displayTickets = role === 'admin' ? tickets : userTickets;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(createTicket(formData)).unwrap();
            alert("Support ticket submitted successfully!");
            setShowModal(false);
            setFormData({
                subject: "",
                description: "",
                priority: "Medium",
                status: "Open",
                userId: ""
            });
        } catch (error: any) {
            alert(error.message || "Failed to submit ticket");
        }
    };

    const handleResolve = async () => {
        if (!selectedTicket || !adminResponse) return;
        try {
            await dispatch(resolveTicket({
                id: selectedTicket._id!,
                adminResponse,
                status: 'Resolved'
            })).unwrap();
            alert("Ticket resolved successfully!");
            setSelectedTicket(null);
            setAdminResponse("");
            // Refresh tickets to show updated status
            if (role === 'admin') {
                dispatch(fetchAllTickets());
            } else {
                dispatch(fetchUserTickets());
            }
        } catch (error: any) {
            alert(error.message || "Failed to resolve ticket");
        }
    };

    return (
        <div className="min-h-screen bg-bg-dark pt-12 pb-24 px-6 lg:px-16">
            {/* Command Header */}
            <div className="max-w-[1600px] mx-auto mb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div className="relative">
                    <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-widest mb-3">
                        <span className="w-8 h-[2px] bg-primary/20"></span>
                        Communications / Service Desk
                    </div>
                    <h1 className="text-4xl font-extrabold text-text-light tracking-tight">
                        Support <span className="text-primary font-black">Operations</span> Desk
                    </h1>
                </div>

                {role !== 'admin' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-white px-8 py-3.5 rounded-xl shadow-lg shadow-primary/20 font-bold text-sm uppercase tracking-widest hover:bg-primary/90 hover:shadow-primary/30 transition-all flex items-center gap-3 self-start active:scale-[0.98]"
                    >
                        <span className="text-xl">⊕</span>
                        <span>Create Service Request</span>
                    </button>
                )}
            </div>

            {/* Operational Metrics Segment */}
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: "Total Requests", value: displayTickets.length, color: "text-text-light" },
                    { label: "Active Threads", value: displayTickets.filter(t => t.status !== 'Resolved').length, color: "text-warning" },
                    { label: "Resolved As % ", value: `${displayTickets.length > 0 ? Math.round((displayTickets.filter(t => t.status === 'Resolved').length / displayTickets.length) * 100) : 0}%`, color: "text-accent" },
                    { label: "Response Latency", value: "< 24H", color: "text-primary" }
                ].map((stat, i) => (
                    <div key={i} className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-bg-dark rounded-full -mr-8 -mt-8"></div>
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-2 opacity-80">{stat.label}</p>
                        <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 text-text-muted gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="font-bold text-sm tracking-widest uppercase opacity-60">Synchronizing Record Stream...</p>
                </div>
            ) : (
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {displayTickets.map((ticket) => (
                        <div key={ticket._id} className="relative bg-card-dark border border-border-dark rounded-2xl p-8 hover:border-primary/30 hover:shadow-xl transition-all group flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm ${ticket.priority === 'High' ? 'bg-danger/10 text-danger border border-danger/20' :
                                    ticket.priority === 'Medium' ? 'bg-warning/10 text-warning border border-warning/20' :
                                        'bg-primary/10 text-primary border border-primary/20'
                                    }`}>
                                    {ticket.priority} Priority
                                </span>
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-bg-dark rounded-lg border border-border-dark">
                                    <div className={`w-2 h-2 rounded-full ${ticket.status === 'Resolved' ? 'bg-accent' : 'bg-warning animate-pulse'}`}></div>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{ticket.status}</span>
                                </div>
                            </div>

                            <div className="mb-8 flex-grow">
                                <h3 className="text-xl font-bold text-text-light group-hover:text-primary transition-colors mb-3 leading-tight">{ticket.subject}</h3>
                                <div className="bg-bg-dark/50 border-l-2 border-primary/30 p-4 rounded-r-xl">
                                    <p className="text-sm text-text-muted leading-relaxed italic font-medium">
                                        "{ticket.description}"
                                    </p>
                                </div>
                            </div>

                            {role === 'admin' ? (
                                <div className="mt-auto pt-6 border-t border-border-dark flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-bg-dark border border-border-dark flex items-center justify-center text-sm font-bold text-primary shadow-sm uppercase">
                                            {(ticket.userId as any)?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-text-light uppercase tracking-tight">{(ticket.userId as any)?.name}</p>
                                            <p className="text-[10px] text-text-muted font-semibold">{(ticket.userId as any)?.email}</p>
                                        </div>
                                    </div>
                                    {ticket.status !== 'Resolved' && (
                                        <button
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-primary/90 shadow-md shadow-primary/10 active:scale-95"
                                        >
                                            Respond
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-auto pt-6 border-t border-border-dark">
                                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-3 opacity-60">System Feedback</p>
                                    {ticket.adminResponse ? (
                                        <div className="bg-accent/5 border border-accent/20 p-5 rounded-2xl relative">
                                            <p className="text-sm text-accent italic font-semibold leading-relaxed">"{ticket.adminResponse}"</p>
                                        </div>
                                    ) : (
                                        <div className="bg-bg-dark border border-border-dark border-dashed p-4 rounded-2xl">
                                            <p className="text-xs text-text-muted italic font-medium opacity-60">Awaiting technical review...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40">
                                <span>REF: {ticket._id?.slice(-8).toUpperCase()}</span>
                                <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'UNKNOWN'}</span>
                            </div>
                        </div>
                    ))}
                    {displayTickets.length === 0 && (
                        <div className="lg:col-span-3 py-32 text-center bg-card-dark border border-border-dark border-dashed rounded-[3rem]">
                            <p className="text-text-muted text-sm font-semibold italic opacity-60">
                                {role === 'admin' ? "Zero active incident streams identified." : "No active support cases identified."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Submit Request Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-text-light/10 backdrop-blur-md flex items-center justify-center z-[200] px-4">
                    <div className="bg-card-dark border border-border-dark rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-primary p-8 text-white">
                            <h2 className="text-2xl font-black tracking-tight uppercase tracking-widest">New Service Ticket</h2>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">Operational Support Desk</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Subject Descriptor</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-5 py-3.5 text-sm text-text-light placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
                                    placeholder="Brief summary of the requirement"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Priority Classification</label>
                                    <div className="flex gap-3">
                                        {['Low', 'Medium', 'High'].map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, priority: level as any })}
                                                className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${formData.priority === level
                                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                        : 'bg-bg-dark text-text-muted border-border-dark hover:border-text-muted/60'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Case Details</label>
                                <textarea
                                    required
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-5 py-3.5 text-sm text-text-light placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-32 transition-all font-medium resize-none leading-relaxed"
                                    placeholder="Provide comprehensive operational data..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-4 border border-border-dark rounded-xl text-text-muted hover:text-text-light hover:bg-bg-dark font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary text-white px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                                >
                                    Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resolution Modal (Admin Only) */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-text-light/20 backdrop-blur-md flex items-center justify-center z-[200] px-4">
                    <div className="bg-card-dark border border-border-dark rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-primary p-8 text-white">
                            <h2 className="text-2xl font-black uppercase tracking-widest">Resolve Case</h2>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">Ref: {selectedTicket._id?.slice(-8).toUpperCase()}</p>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="bg-bg-dark/50 border border-border-dark p-6 rounded-2xl relative overflow-hidden">
                                <h4 className="text-[10px] font-bold uppercase text-primary tracking-widest mb-3">Original Request</h4>
                                <p className="text-sm font-bold text-text-light mb-1">{selectedTicket.subject}</p>
                                <p className="text-xs text-text-muted italic leading-relaxed font-medium">"{selectedTicket.description}"</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Technical Response</label>
                                <textarea
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-5 py-3.5 text-sm text-text-light placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-32 transition-all font-medium resize-none leading-relaxed"
                                    placeholder="Enter terminal response..."
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="flex-1 px-4 py-4 border border-border-dark rounded-xl text-text-muted hover:text-text-light hover:bg-bg-dark font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={handleResolve}
                                    className="flex-1 bg-accent text-white px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-[0.98]"
                                >
                                    Finalize Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
