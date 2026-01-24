import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendApi } from "../../../api.ts";

export function CompleteProfile() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nic: "",
        contactNumber: ""
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.nic || !form.contactNumber) {
            alert("Both NIC and Mobile Number are required.");
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            await backendApi.put("/api/v1/users/profile", {
                nic: form.nic,
                contactNumber: form.contactNumber
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Mark profile as complete in localStorage
            localStorage.setItem("profileComplete", "true");

            alert("Profile completed successfully!");
            navigate("/home");
        } catch (err: any) {
            console.error("Profile update error:", err);
            const errorMsg = err.response?.data?.error || "Failed to update profile. Please try again.";
            alert(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-100">
            <div className="bg-white shadow-md p-8 rounded-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-2 text-center text-blue-600">Complete Your Profile</h2>
                <p className="text-gray-600 text-center mb-6 text-sm">
                    Please provide your NIC and mobile number to continue using the app.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            NIC Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nic"
                            placeholder="Enter your NIC (e.g., 200012345678)"
                            value={form.nic}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            name="contactNumber"
                            placeholder="Enter your mobile number (e.g., 0771234567)"
                            value={form.contactNumber}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Complete Profile'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-500 mt-4">
                    This information is required for verification and contact purposes.
                </p>
            </div>
        </div>
    );
}
