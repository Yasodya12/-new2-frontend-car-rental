import { useState } from "react";
import { getUserFromToken } from "../../../auth/auth.ts";
import { backendApi } from "../../../api.ts";
import { AxiosError } from "axios";

export interface UserData {
    _id?: string
    name: string,
    email: string,
    password: string
    role: string
    profileImage?: string | null | undefined
    nic?: string
    contactNumber?: string
    dateOfBirth?: string | Date | null
    gender?: string | null
    averageRating?: number
    totalRatings?: number
    experience?: number
    provincesVisited?: { province: string; count: number }[]
    isAvailable?: boolean
    isApproved?: boolean
    location?: {
        lat?: number
        lng?: number
        address?: string
    }
}

interface RatingModalProps {
    tripId: string;
    driverId: string;
    driverName: string;
    onClose: () => void;
    onRatingSubmitted: () => void;
}

export function RatingModal({ tripId, driverId, driverName, onClose, onRatingSubmitted }: RatingModalProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            alert("Please select a rating");
            return;
        }

        setLoading(true);
        try {
            const accessToken = localStorage.getItem("accessToken");

            // Get user from token

            const tokenUser = getUserFromToken(accessToken || "");

            if (!tokenUser || !tokenUser._id) {
                alert("Session expired. Please log in again.");
                return;
            }

            await backendApi.post("/api/v1/ratings/save", {
                tripId,
                driverId,
                customerId: tokenUser._id,
                rating,
                comment: comment.trim() || undefined
            });

            alert("Thank you for your rating!");
            onRatingSubmitted();
            onClose();
        } catch (error: unknown) {
            console.error("Rating submission error:", error);
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || error.response?.data?.message;
                if (errorMessage?.includes("already exists")) {
                    alert("You have already rated this trip.");
                } else {
                    alert(`Failed to submit rating: ${errorMessage || "Unknown error"}`);
                }
            } else {
                alert("Failed to submit rating. Please check your connection and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Rate Your Driver</h2>
                <p className="text-gray-600 mb-4">How was your trip with <strong>{driverName}</strong>?</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Rating</label>
                        <div className="flex gap-2 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="text-4xl focus:outline-none transition-transform hover:scale-110"
                                >
                                    {star <= (hoveredRating || rating) ? "⭐" : "☆"}
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-center mt-2 text-sm text-gray-600">
                                {rating === 5 && "Excellent"}
                                {rating === 4 && "Very Good"}
                                {rating === 3 && "Good"}
                                {rating === 2 && "Fair"}
                                {rating === 1 && "Poor"}
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md"
                            placeholder="Share your experience..."
                        />
                    </div>

                    <div className="flex justify-between items-center mt-4">
                        <button
                            type="button"
                            onClick={async () => {
                                if (window.confirm(`Are you sure you want to block ${driverName}? This driver will not be matched with you again.`)) {
                                    try {
                                        await backendApi.patch("/api/v1/user/block-driver", { driverId });
                                        alert("Driver blocked successfully.");
                                    } catch (err) {
                                        console.error(err);
                                        alert("Failed to block driver.");
                                    }
                                }
                            }}
                            className="text-red-500 hover:text-red-700 text-sm underline"
                        >
                            Block Driver
                        </button>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                                disabled={loading || rating === 0}
                            >
                                {loading ? "Submitting..." : "Submit Rating"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

