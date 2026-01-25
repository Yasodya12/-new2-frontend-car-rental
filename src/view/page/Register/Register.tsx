import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { backendApi } from "../../../api.ts";
import { LocationPicker } from "../../common/Map/LocationPicker.tsx";
import { ImageUpload } from "../../components/ImageUpload/ImageUpload.tsx";
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiArrowRight, HiUser, HiPhone, HiIdentification, HiKey } from 'react-icons/hi';
import { FaCar, FaMapMarkerAlt } from 'react-icons/fa';

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
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Location state for drivers
    const [baseLocation, setBaseLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (url: string) => {
        setForm(prev => ({ ...prev, profileImage: url }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        let payload: RegisterForm = form;

        if (form.role === "driver") {
            if (!baseLocation) {
                alert("Please select your base location on the map.");
                setIsLoading(false);
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex relative overflow-hidden bg-bg-dark">
            {/* Dynamic Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] animate-pulse"
                    style={{ backgroundColor: '#4F9CF9' }}
                ></div>
                <div
                    className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] animate-pulse"
                    style={{ backgroundColor: '#22C55E' }}
                ></div>
            </div>

            {/* Form Section - Full Screen */}
            <div className="w-full flex items-center justify-center px-4 lg:px-6 py-4 relative z-10">
                <div className={`w-full h-full max-w-7xl transition-all duration-1000 delay-300 flex flex-col ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    {/* Header - Compact */}
                    <div className="text-center mb-3 flex-shrink-0">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary shadow-lg shadow-primary/30">
                                <FaCar className="text-white text-lg" />
                            </div>
                            <span className="text-xl font-bold text-text-light">RideHub</span>
                        </div>
                        <h2 className="text-2xl font-bold text-text-light mb-1">Create Your Account</h2>
                    </div>

                    {/* Register Card - Full Height */}
                    <div className="bg-card-dark/90 backdrop-blur-2xl rounded-2xl border border-border-dark/50 p-6 shadow-2xl relative overflow-hidden group flex-1 overflow-y-auto">
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
                        
                        {/* Decorative Corner Accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-tr-full blur-3xl"></div>
                        
                        {/* Decorative Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4F9CF9" strokeWidth="0.5"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                        </div>

                        <form onSubmit={handleSubmit} className="relative z-10">
                            {/* Profile Picture - Full Width */}
                            <div className="flex justify-center mb-4">
                                <ImageUpload
                                    onUpload={handleImageUpload}
                                    label="Profile Picture (Optional)"
                                />
                            </div>

                            {/* Two Column Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">Full Name</label>
                                    <div className="relative group">
                                        <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="John Doe"
                                            autoComplete="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className="w-full bg-bg-dark/60 border border-border-dark rounded-xl py-3 pl-12 pr-4 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-text-muted/50"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">Email Address</label>
                                    <div className="relative group">
                                        <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="name@company.com"
                                            autoComplete="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            className="w-full bg-bg-dark/60 border border-border-dark rounded-xl py-3 pl-12 pr-4 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-text-muted/50"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* NIC Number */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">NIC Number</label>
                                    <div className="relative group">
                                        <HiIdentification className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="nic"
                                            placeholder="123456789V"
                                            value={form.nic}
                                            onChange={handleChange}
                                            className="w-full bg-bg-dark/60 border border-border-dark rounded-xl py-3 pl-12 pr-4 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-text-muted/50"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Mobile Number */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">Mobile Number</label>
                                    <div className="relative group">
                                        <HiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="contactNumber"
                                            placeholder="+94 77 123 4567"
                                            value={form.contactNumber}
                                            onChange={handleChange}
                                            className="w-full bg-bg-dark/60 border border-border-dark rounded-xl py-3 pl-12 pr-4 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-text-muted/50"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">Password</label>
                                    <div className="relative group">
                                        <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Create a strong password"
                                            autoComplete="new-password"
                                            value={form.password}
                                            onChange={handleChange}
                                            className="w-full bg-bg-dark/60 border border-border-dark rounded-xl py-3 pl-12 pr-12 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-text-muted/50"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light transition-colors"
                                        >
                                            {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">Account Type</label>
                                    <div className="relative group">
                                        <HiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-muted pointer-events-none" />
                                        <select
                                            name="role"
                                            value={form.role}
                                            onChange={handleChange}
                                            className="w-full bg-bg-dark/60 border border-border-dark rounded-xl py-3 pl-12 pr-10 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="customer" className="bg-card-dark">Customer</option>
                                            <option value="driver" className="bg-card-dark">Driver</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Driver Specific Fields */}
                            {form.role === "driver" && (
                                <div className="space-y-4 pt-4 mt-4 border-t border-border-dark/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                                            <FaCar className="text-primary" />
                                        </div>
                                        <h3 className="text-base font-bold text-text-light">Driver Information</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ImageUpload
                                            onUpload={(url) => setForm(prev => ({ ...prev, licenseImage: url }))}
                                            label="Driving License"
                                        />
                                        <ImageUpload
                                            onUpload={(url) => setForm(prev => ({ ...prev, idImage: url }))}
                                            label="NIC Image"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider flex items-center gap-2">
                                            <FaMapMarkerAlt className="text-primary" />
                                            Base Location (Required)
                                        </label>
                                        <LocationPicker
                                            label=""
                                            onLocationSelect={(lat, lng, address) => {
                                                setBaseLocation({ lat, lng, address });
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group mt-4"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Account</span>
                                        <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer - Compact */}
                    <p className="text-center mt-3 text-xs text-text-muted flex-shrink-0">
                        Already have an account? <Link to="/login" className="text-primary font-bold hover:underline transition-all">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
