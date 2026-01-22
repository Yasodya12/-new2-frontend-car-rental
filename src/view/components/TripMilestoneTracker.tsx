interface TripMilestoneTrackerProps {
    status: string;
}

export function TripMilestoneTracker({ status }: TripMilestoneTrackerProps) {
    const milestones = [
        { key: "Pending", label: "Requested", icon: "📩", description: "Waiting for driver" },
        { key: "Accepted", label: "Driver Assigned", icon: "🤝", description: "Driver is coming" },
        { key: "Processing", label: "In Transit", icon: "🚖", description: "Journey in progress" },
        { key: "Completed", label: "Arrived", icon: "🏁", description: "Waiting payment" },
        { key: "Paid", label: "Paid", icon: "💰", description: "Trip completed" }
    ];

    // Helper to determine active index
    const getActiveIndex = (status: string) => {
        if (status === "Pending") return 0;
        if (status === "Accepted") return 1;
        if (status === "Processing") return 2;
        if (status === "Completed") return 3;
        if (status === "Paid") return 4;
        return -1;
    };

    const activeIndex = getActiveIndex(status);

    return (
        <div className="w-full py-6 px-2">
            <div className="relative flex justify-between items-start">
                {/* Connecting Line */}
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10 mx-6">
                    <div
                        className="h-full bg-blue-600 transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                        style={{ width: `${(activeIndex / (milestones.length - 1)) * 100}%` }}
                    />
                </div>

                {milestones.map((m, idx) => {
                    const isCompleted = idx < activeIndex || (status === "Paid" && idx === activeIndex);
                    const isActive = idx === activeIndex && status !== "Paid";
                    // Removed isUpcoming as it was unused

                    return (
                        <div key={m.key} className="flex flex-col items-center flex-1 text-center group">
                            {/* Icon Circle */}
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 border-4 ${isCompleted
                                    ? "bg-blue-600 border-blue-100 text-white shadow-md scale-110"
                                    : isActive
                                        ? "bg-white border-blue-600 text-blue-600 shadow-lg scale-125 animate-pulse"
                                        : "bg-gray-100 border-white text-gray-400"
                                    }`}
                            >
                                {isCompleted ? "✓" : m.icon}
                            </div>

                            {/* Label */}
                            <div className="mt-3">
                                <p className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? "text-blue-700" : isCompleted ? "text-blue-600" : "text-gray-400"
                                    }`}>
                                    {m.label}
                                </p>
                                <p className={`text-[9px] mt-0.5 font-medium transition-colors duration-300 ${isActive ? "text-gray-600" : "text-gray-400"
                                    }`}>
                                    {m.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
