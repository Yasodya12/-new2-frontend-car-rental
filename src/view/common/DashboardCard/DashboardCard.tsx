import type { ReactNode } from "react";

interface DashboardCardProps {
    label: string;
    value: number | string;
    icon?: ReactNode;
    trend?: string;
    color?: 'primary' | 'accent' | 'warning' | 'danger';
    progress?: number; // 0-100 for progress indicator
    size?: 'normal' | 'large';
}

export function DashboardCard({ label, value, icon, trend, color = 'primary', progress, size = 'normal' }: DashboardCardProps) {
    const colorConfig = {
        primary: {
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-600',
            gradient: 'from-blue-50 to-transparent',
            glow: 'shadow-[0_8px_30px_rgb(59,130,246,0.1)]'
        },
        accent: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-600',
            gradient: 'from-emerald-50 to-transparent',
            glow: 'shadow-[0_8px_30px_rgb(16,185,129,0.1)]'
        },
        warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-600',
            gradient: 'from-amber-50 to-transparent',
            glow: 'shadow-[0_8px_30px_rgb(245,158,11,0.1)]'
        },
        danger: {
            bg: 'bg-red-50',
            border: 'border-red-100',
            text: 'text-red-600',
            gradient: 'from-red-50 to-transparent',
            glow: 'shadow-[0_8px_30px_rgb(239,68,68,0.1)]'
        }
    };

    const config = colorConfig[color];
    const isLarge = size === 'large';

    return (
        <div className={`dashboard-stat-card bg-white rounded-2xl border border-gray-100 p-6 shadow-sm transition-all duration-300 group relative overflow-hidden transform hover:translate-y-[-4px] hover:shadow-md hover:border-blue-200`}>
            {/* Very Subtle Ambient Glow */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 ${config.bg} rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center ${config.text} transition-all duration-300 group-hover:scale-110`}>
                        <div className="text-xl">{icon}</div>
                    </div>
                    {trend && (
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-semibold tracking-wide ${config.bg} border ${config.border} ${config.text} flex items-center gap-1.5`}>
                            <span className="w-1 h-1 rounded-full bg-current opacity-60"></span>
                            {trend}
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-gray-500 transition-colors uppercase">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <p className={`${isLarge ? 'text-4xl' : 'text-3xl'} font-bold text-gray-900 tracking-tight`}>
                            {value}
                        </p>
                    </div>
                </div>

                {/* Refined Progress bar */}
                {progress !== undefined && (
                    <div className="mt-8 pt-4 border-t border-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Efficiency</span>
                            <span className={`text-[9px] font-bold ${config.text}`}>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <div
                                className={`h-full bg-blue-600 rounded-full transition-all duration-1000 ease-in-out relative`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
