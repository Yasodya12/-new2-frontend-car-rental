// components/VehicleModal.tsx
import type {VehicleData} from "../../../Model/vehicleData";

type Props = {
    vehicle: VehicleData;
    onClose: () => void;
    onUpdate: (vehicle: VehicleData) => void;
    onDelete: (id: string) => void;
};

export function VehicleModal({vehicle, onClose, onUpdate, onDelete}: Props) {
    const imageUrl = vehicle.image ? `http://localhost:3000/uploads/vehicle/${vehicle.image}` : "";

    const role = localStorage.getItem("role");

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-2xl p-6 relative">
                <button
                    className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-xl"
                    onClick={onClose}
                >
                    ✖
                </button>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/2">
                        <img
                            src={imageUrl}
                            alt={vehicle.name}
                            className="w-full h-60 object-cover rounded-lg"
                        />
                    </div>

                    <div className="md:w-1/2 flex flex-col gap-2">
                        <h2 className="text-2xl font-bold text-gray-800">{vehicle.name}</h2>
                        <p className="text-gray-600"><strong>Brand:</strong> {vehicle.brand}</p>
                        <p className="text-gray-600"><strong>Model:</strong> {vehicle.model}</p>
                        <p className="text-gray-600"><strong>Year:</strong> {vehicle.year}</p>
                        <p className="text-gray-600"><strong>Color:</strong> {vehicle.color}</p>
                        <p className="text-gray-600"><strong>Seats:</strong> {vehicle.seats}</p>
                        <p className="text-gray-600"><strong>Description:</strong> {vehicle.description}</p>

                        {role === "admin" && (
                            <div className="flex gap-4 mt-4">

                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                                onClick={() => onUpdate(vehicle)}
                            >
                                Update
                            </button>
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                onClick={() => vehicle._id && onDelete(vehicle._id)}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
}
