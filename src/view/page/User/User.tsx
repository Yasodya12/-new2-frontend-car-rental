import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { backendApi } from "../../../api.ts";
import { getUserFromToken } from "../../../auth/auth.ts";
import type { UserData } from "../../../Model/userData.ts";
import { LocationPicker } from "../../common/Map/LocationPicker.tsx";
import { ImageUpload } from "../../components/ImageUpload/ImageUpload.tsx";

export function User() {
    const [userData, setUserData] = useState<UserData>({
        name: "",
        email: "",
        password: "",
        role: "",
        profileImage: null,
    });

    // imageFile and previewImage state removed as ImageUpload handles it internally

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            const user = getUserFromToken(token);
            backendApi.get(`/api/v1/users/find-by-email/${user.email}`).then(res => {
                setUserData(res.data);
                // No need to set manual preview image string here, passed as prop to ImageUpload if needed
                // But ImageUpload takes initialImage. 
                // However, userData.profileImage handles the URL storage.
            });
        }
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageUpload = (url: string) => {
        setUserData(prev => ({
            ...prev,
            profileImage: url
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Local file upload logic removed

            const res = await backendApi.put(`/api/v1/users/update/${userData._id}`, userData);
            if (res.status === 200) {
                alert("User updated successfully!");
            }
        } catch (err) {
            console.error(err);
            alert("Update failed.");
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete your account?")) {
            try {
                await backendApi.delete(`/api/v1/users/delete/${userData._id}`);
                alert("Account deleted.");
                localStorage.clear();
                window.location.href = "/login";
            } catch (err) {
                console.error(err);
                alert("Account deletion failed.");
            }
        }
    };

    // Helper to get correct image URL for display/initial value
    const getInitialImage = () => {
        if (!userData.profileImage) return undefined;
        if (userData.profileImage.startsWith("http")) return userData.profileImage;
        return `http://localhost:3000/uploads/profile/${userData.profileImage}`;
    };

    return (
        <div className="min-h-screen bg-bg-dark pt-12 pb-24 px-6 lg:px-16">
            {/* Command Header */}
            <div className="max-w-[1400px] mx-auto mb-12">
                <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                    <span className="w-8 h-[2px] bg-primary/20"></span>
                    Personnel / Account Settings
                </div>
                <h1 className="text-4xl font-extrabold text-text-light tracking-tight">
                    User <span className="text-primary font-black">Profile</span> Dashboard
                </h1>
            </div>

            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-card-dark border border-border-dark rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-bg-dark rounded-full -mr-8 -mt-8"></div>

                        <div className="relative flex flex-col items-center text-center">
                            <div className="relative mb-8 pt-4">
                                <div className="absolute -inset-2 bg-primary/5 rounded-[2rem] blur-md"></div>
                                <div className="w-full max-w-sm relative">
                                    <ImageUpload
                                        onUpload={handleImageUpload}
                                        initialImage={getInitialImage()}
                                        label="Update Photo"
                                    />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-text-light tracking-tight mb-2 uppercase leading-none">{userData.name}</h2>
                            <div className="inline-flex items-center gap-2 bg-bg-dark border border-border-dark px-4 py-1.5 rounded-full mb-8">
                                <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Verified {userData.role}</span>
                            </div>

                            <div className="w-full pt-8 border-t border-border-dark space-y-4">
                                <Link to="/change-password"
                                    className="flex items-center justify-center gap-3 w-full py-4 bg-bg-dark hover:bg-border-dark text-text-light text-[11px] font-bold uppercase tracking-widest rounded-2xl border border-border-dark transition-all shadow-sm group/btn">
                                    <span className="text-xl group-hover/btn:scale-110 transition-transform">🔐</span>
                                    Security Parameters
                                </Link>
                                <button onClick={handleDelete}
                                    className="flex items-center justify-center gap-2 w-full py-3 text-danger/60 hover:text-danger text-[10px] font-bold uppercase tracking-widest transition-all">
                                    Deactivate Operational Account
                                </button>
                            </div>
                        </div>
                    </div>

                    {userData.role === "driver" && (
                        <div className="bg-card-dark border border-border-dark rounded-[2rem] p-8 shadow-lg">
                            <h3 className="text-xs font-bold text-text-muted mb-6 uppercase tracking-widest opacity-60">System Status</h3>
                            <div className={`p-6 rounded-2xl border transition-all ${userData.isAvailable !== false ? 'bg-accent/5 border-accent/20' : 'bg-danger/5 border-danger/20'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${userData.isAvailable !== false ? 'text-accent' : 'text-danger'
                                        }`}>
                                        {userData.isAvailable !== false ? 'Online & Ready' : 'Offline / Idle'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={userData.isAvailable !== false}
                                            onChange={(e) => setUserData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent shadow-inner"></div>
                                    </label>
                                </div>
                                <p className="text-[11px] text-text-muted italic leading-relaxed font-medium">
                                    {userData.isAvailable !== false
                                        ? "Your terminal is currently broadcasting availability to the dispatch network."
                                        : "Hidden from search. You will not receive any new sortie requests."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Content */}
                <div className="lg:col-span-8 space-y-10">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Information Vector */}
                        <div className="bg-card-dark border border-border-dark rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
                            <h3 className="text-xl font-bold text-text-light mb-10 flex items-center gap-4">
                                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm shadow-sm">👤</span>
                                Personal Identification Stream
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { label: "Legal Name", name: "name", value: userData.name, type: "text", disabled: false },
                                    { label: "Email Terminal", name: "email", value: userData.email, type: "email", disabled: true },
                                    { label: "Identification (NIC)", name: "nic", value: userData.nic || "", type: "text", disabled: false },
                                    { label: "Contact Secondary", name: "contactNumber", value: userData.contactNumber || "", type: "text", disabled: false }
                                ].map((field, i) => (
                                    <div key={i}>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 px-1">{field.label}</label>
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            value={field.value}
                                            onChange={handleChange}
                                            disabled={field.disabled}
                                            className={`w-full bg-bg-dark border border-border-dark rounded-xl px-6 py-3.5 text-sm font-bold text-text-light focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm ${field.disabled ? 'opacity-50 cursor-not-allowed bg-card-dark/50' : ''}`}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 grid grid-cols-2 gap-6 bg-bg-dark border border-border-dark p-6 rounded-3xl border-dashed">
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1 shadow-sm px-1">Birth Record</p>
                                    <p className="text-sm font-bold text-text-light tracking-wide px-1">
                                        {(() => {
                                            if (!userData.dateOfBirth) return "STREAM_PENDING";
                                            if (typeof userData.dateOfBirth === "string" && userData.dateOfBirth.includes("-")) {
                                                const [year, month, day] = userData.dateOfBirth.split("-");
                                                return `${day}/${month}/${year}`;
                                            }
                                            return new Date(userData.dateOfBirth).toLocaleDateString();
                                        })()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1 shadow-sm px-1">Gender Class</p>
                                    <p className="text-sm font-bold text-text-light tracking-wide uppercase px-1">{userData.gender || "STREAM_PENDING"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location HUD */}
                        {userData.role === "driver" && (
                            <div className="bg-card-dark border border-border-dark rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
                                <h3 className="text-xl font-bold text-text-light mb-10 flex items-center gap-4">
                                    <span className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-sm shadow-sm">📍</span>
                                    Operational Geolocation
                                </h3>
                                <div className="space-y-8">
                                    <div className="bg-bg-dark rounded-2xl overflow-hidden border border-border-dark p-2">
                                        <LocationPicker
                                            label="Base Station Coordinate"
                                            onLocationSelect={(lat: number, lng: number, address: string) => {
                                                setUserData(prev => ({
                                                    ...prev,
                                                    location: { lat, lng, address }
                                                }));
                                            }}
                                            initialLocation={userData.location && userData.location.lat && userData.location.lng ? { lat: userData.location.lat, lng: userData.location.lng } : undefined}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Finalize Action */}
                        <div className="flex justify-end pt-6">
                            <button type="submit"
                                className="bg-primary text-white px-16 py-4.5 rounded-[2rem] shadow-xl shadow-primary/20 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary/90 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                                Commit Profile Dimensions
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
