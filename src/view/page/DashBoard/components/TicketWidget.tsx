import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../../../store/store";
import type { rootReducerState } from "../../../../slices/RootReducers";
import { fetchAllTickets, resolveTicket } from "../../../../slices/ticketSlice";
import type { TicketData } from "../../../../Model/TicketData";

export function TicketWidget() {
    const dispatch = useDispatch<AppDispatch>();
    const { tickets } = useSelector((state: rootReducerState) => state.tickets);
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
    const [adminResponse, setAdminResponse] = useState("");

    useEffect(() => {
        dispatch(fetchAllTickets());
    }, [dispatch]);

    const openTickets = tickets.filter(t => t.status !== 'Resolved');

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
        } catch (error: any) {
            alert(error.message || "Failed to resolve ticket");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span>🎫</span> Active Support Tickets
                </h3>
                <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {openTickets.length} Pending
                </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {openTickets.map((ticket) => (
                    <div key={ticket._id} className="p-4 hover:bg-gray-50 transition animate-fade-in">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-gray-800">{ticket.subject}</div>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                                ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                {ticket.priority}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ticket.description}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 font-mono">
                                from: {(ticket.userId as any)?.name || 'User'}
                            </span>
                            <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold"
                            >
                                Reply & Resolve
                            </button>
                        </div>
                    </div>
                ))}

                {openTickets.length === 0 && (
                    <div className="p-12 text-center text-gray-400 italic text-sm">
                        No active support tickets. All caught up! 🎉
                    </div>
                )}
            </div>

            {/* Resolve Modal */}
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
