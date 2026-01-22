import { useEffect, useState, type ChangeEvent } from "react";
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
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">User Profile</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">

                <div className="flex justify-center mb-6">
                    <div className="w-full max-w-sm">
                        <ImageUpload
                            onUpload={handleImageUpload}
                            initialImage={getInitialImage()}
                            label="Profile Picture"
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-1 font-medium">Name</label>
                    <input type="text" name="name" value={userData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-md" required />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Email</label>
                    <input type="email" name="email" value={userData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-md" required />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Password</label>
                    <input type="password" name="password" value={userData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-md" required />
                </div>

                {userData.role === "driver" && (
                    <LocationPicker
                        label="Base Location"
                        onLocationSelect={(lat: number, lng: number, address: string) => {
                            setUserData(prev => ({
                                ...prev,
                                location: { lat, lng, address }
                            }));
                        }}
                        initialLocation={userData.location && userData.location.lat && userData.location.lng ? { lat: userData.location.lat, lng: userData.location.lng } : undefined}
                    />
                )}

                {userData.role === "driver" && (
                    <div className="mt-4 p-4 border rounded-lg bg-blue-50 border-blue-100">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={userData.isAvailable !== false}
                                onChange={(e) => setUserData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="font-medium text-gray-800">Available for Trips</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-8">
                            When disabled, you won't appear in search results for new trips.
                        </p>
                    </div>
                )}

                <div className="flex justify-between mt-4">
                    <button type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow-md">
                        Update Profile
                    </button>

                    <button type="button" onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded shadow-md">
                        Delete Account
                    </button>
                </div>
            </form>
        </div>
    );
}
