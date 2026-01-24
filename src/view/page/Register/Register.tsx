import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendApi } from "../../../api.ts";
import { LocationPicker } from "../../common/Map/LocationPicker.tsx";
import { ImageUpload } from "../../components/ImageUpload/ImageUpload.tsx";

interface Location {
    lat: number;
    lng: number;
    address: string;
}

interface BaseForm {
    name: string;
    email: string;
    password: string;
    nic: string;
    contactNumber: string;
    profileImage: string;
}

interface DriverForm extends BaseForm {
    role: "driver";
    location: Location;
    licenseImage?: string;
    idImage?: string;
}

interface NonDriverForm extends BaseForm {
    role: "customer" | "admin";
}

type RegisterForm = DriverForm | NonDriverForm;



export function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState<RegisterForm>({
        name: "",
        email: "",
        password: "",
        nic: "",
        contactNumber: "",
        role: "customer",
        profileImage: "",
    });


    // Location state for drivers
    const [baseLocation, setBaseLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (url: string) => {
        setForm(prev => ({ ...prev, profileImage: url }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let payload: RegisterForm = form;

        if (form.role === "driver") {
            if (!baseLocation) {
                alert("Please select your base location on the map.");
                return;
            }

            payload = {
                ...form,
                location: {
                    lat: baseLocation.lat,
                    lng: baseLocation.lng,
                    address: baseLocation.address,
                },
            };
        }

        try {
            const response = await backendApi.post("/api/v1/users/register", payload);
            if (response.status === 201) {
                alert("Registration successful.");
                navigate("/login");
            } else {
                alert("Registration failed. Please check your details.");
            }
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.error || "Registration failed.";
            alert(errorMsg);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="bg-white shadow-md p-8 rounded-lg w-full max-w-md my-8">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600 font-display">Create Account</h2>
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="mb-4">
                        <ImageUpload
                            onUpload={handleImageUpload}
                            label="Profile Picture (Optional)"
                        />
                    </div>

                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        autoComplete='username'
                        value={form.name}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        autoComplete={'email'}
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="nic"
                            placeholder="NIC Number"
                            value={form.nic}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                        <input
                            type="text"
                            name="contactNumber"
                            placeholder="Mobile Number"
                            value={form.contactNumber}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="customer">Customer</option>
                        <option value="driver">Driver</option>
                    </select>

                    {form.role === "driver" && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <ImageUpload
                                onUpload={(url) => setForm(prev => ({ ...prev, licenseImage: url }))}
                                label="Driving License"
                            />
                            <ImageUpload
                                onUpload={(url) => setForm(prev => ({ ...prev, idImage: url }))}
                                label="NIC Image"
                            />
                        </div>
                    )}

                    {form.role === "driver" && (
                        <LocationPicker
                            label="Base Location (Required for Drivers)"
                            onLocationSelect={(lat, lng, address) => {
                                setBaseLocation({ lat, lng, address });
                            }}
                        />
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                        Register
                    </button>
                </form>
                <p className="text-center text-sm mt-4">
                    Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
                </p>
            </div>
        </div>
    );
}

