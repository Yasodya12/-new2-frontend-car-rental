export function DashboardCard({label, value}: { label: string; value: number | string }) {
    return (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <h3 className="text-2xl font-semibold text-gray-600">{label}</h3>
            <p className="text-4xl font-bold text-blue-700 mt-2">{value}</p>
        </div>
    );
}
