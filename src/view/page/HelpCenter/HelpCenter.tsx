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
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-indigo-700">Help Center 🎫</h1>
                {role !== 'admin' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md font-bold transition flex items-center gap-2"
                    >
                        <span>➕</span> Submit New Ticket
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center p-12 text-gray-500">Loading tickets...</div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-indigo-600 text-white uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Subject</th>
                                {role === 'admin' && <th className="px-6 py-4">User</th>}
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created At</th>
                                <th className="px-6 py-4">Admin Response</th>
                                {role === 'admin' && <th className="px-6 py-4">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {displayTickets.map((ticket) => (
                                <tr key={ticket._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{ticket.subject}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs">{ticket.description}</div>
                                    </td>
                                    {role === 'admin' && (
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold">{(ticket.userId as any)?.name}</div>
                                            <div className="text-[10px] text-gray-500">{(ticket.userId as any)?.email}</div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                                            ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs">
                                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {ticket.adminResponse ? (
                                            <div className="text-xs text-green-700 italic">"{ticket.adminResponse}"</div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Awaiting response...</span>
                                        )}
                                    </td>
                                    {role === 'admin' && (
                                        <td className="px-6 py-4">
                                            {ticket.status !== 'Resolved' && (
                                                <button
                                                    onClick={() => setSelectedTicket(ticket)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-[10px] font-bold shadow-sm transition"
                                                >
                                                    Respond
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {displayTickets.length === 0 && (
                                <tr>
                                    <td colSpan={role === 'admin' ? 7 : 5} className="px-6 py-12 text-center text-gray-500 italic">
                                        {role === 'admin' ? "No support tickets found in the system." : "No support tickets found. Need help? Submit a new ticket!"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Submit Ticket Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-indigo-600 text-white p-5 flex justify-between items-center rounded-t-xl">
                            <h2 className="text-xl font-bold">Submit New Ticket 🎫</h2>
                            <button onClick={() => setShowModal(false)} className="text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Briefly describe the issue"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                                    placeholder="Provide detailed information about your issue"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow-md"
                                >
                                    Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resolve Modal (Admin Only) */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-indigo-600 text-white p-5 flex justify-between items-center rounded-t-xl">
                            <h2 className="text-xl font-bold">Resolve Ticket</h2>
                            <button onClick={() => setSelectedTicket(null)} className="text-2xl font-bold">&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-700">Subject: {selectedTicket.subject}</h4>
                                <p className="text-xs text-gray-500 mt-1">{selectedTicket.description}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Response</label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-sm"
                                    placeholder="Enter your reply to the user..."
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResolve}
                                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow-md"
                                >
                                    Resolve Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
