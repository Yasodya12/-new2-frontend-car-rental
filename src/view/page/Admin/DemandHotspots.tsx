import { useState, useEffect } from 'react';
import { FaRoute, FaCar, FaMapMarkerAlt } from 'react-icons/fa';
import { backendApi } from '../../../api';

export function DemandHotspots() {
    const [demandSignals, setDemandSignals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterReason, setFilterReason] = useState<'All' | 'no_drivers' | 'no_vehicles' | 'both'>('All');

    useEffect(() => {
        const fetchDemandSignals = async () => {
            try {
                const res = await backendApi.get("/api/v1/demand");
                setDemandSignals(res.data);
            } catch (err) {
                console.error("Error fetching demand signals:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDemandSignals();
    }, []);

    const filteredSignals = demandSignals.filter(signal => {
        if (filterReason === 'All') return true;
        return signal.reason === filterReason;
    });

    const getCountByReason = (reason: string) => {
        if (reason === 'All') return demandSignals.length;
        return demandSignals.filter(s => s.reason === reason).length;
    };

    return (
        <div className="p-8 lg:p-14 bg-bg-dark min-h-screen">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] p-10 shadow-[0_40px_90px_rgba(0,0,0,0.04)] border border-white/20 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                                <FaMapMarkerAlt size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Demand Hotspots</h1>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Strategic Coverage Intelligence</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                            <div className="px-6 py-3 text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Intelligence</p>
                                <p className="text-2xl font-black text-purple-600">{filteredSignals.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] p-1 shadow-[0_40px_90px_rgba(0,0,0,0.04)] border border-white/20 relative overflow-hidden">
                    <div className="p-8 lg:p-14">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Systemic Coverage Map (Ledger)</h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
                                {[
                                    { id: 'All', label: 'All Gaps', color: 'purple' },
                                    { id: 'no_drivers', label: 'Driver Shortage', color: 'orange' },
                                    { id: 'no_vehicles', label: 'Vehicle Scarcity', color: 'blue' },
                                    { id: 'both', label: 'Total Outage', color: 'red' }
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setFilterReason(filter.id as any)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterReason === filter.id
                                            ? 'bg-white text-purple-600 shadow-md ring-1 ring-purple-100'
                                            : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                            }`}
                                    >
                                        {filter.label}
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] ${filterReason === filter.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {getCountByReason(filter.id)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="py-24 text-center">
                                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Processing Intelligence...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            <th className="px-8 pb-4">Area Geometry</th>
                                            <th className="px-8 pb-4">Reporting User</th>
                                            <th className="px-8 pb-4">Critical Deficiency</th>
                                            <th className="px-8 pb-4 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSignals.map((signal, idx) => (
                                            <tr key={idx} className="group bg-white hover:bg-purple-50/20 transition-all rounded-3xl">
                                                <td className="px-8 py-6 rounded-l-[1.8rem] border-y border-l border-gray-50 max-w-[300px]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-400 flex items-center justify-center font-black">
                                                            <FaRoute size={16} />
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-800 truncate">{signal.address}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 border-y border-gray-50">
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900">{signal.userId?.name || "Anonymous Requester"}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 mt-0.5">{signal.userId?.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 border-y border-gray-50">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-red-50 text-red-600 border border-red-100`}>
                                                        {signal.reason === 'both' ? 'Vehicle & Driver Outage' :
                                                            signal.reason === 'no_drivers' ? 'Driver Shortage' : 'Vehicle Scarcity'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 rounded-r-[1.8rem] border-y border-r border-gray-50 text-right">
                                                    <p className="text-xs font-bold text-gray-900">{new Date(signal.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-[9px] font-medium text-gray-400 mt-0.5">{new Date(signal.createdAt).toLocaleTimeString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {filteredSignals.length === 0 && (
                                    <div className="py-24 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                                            <FaCar size={32} />
                                        </div>
                                        <p className="text-xl font-black text-gray-900 tracking-tight">No Coverage Gaps</p>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">No signals match the current intelligence parameters</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
