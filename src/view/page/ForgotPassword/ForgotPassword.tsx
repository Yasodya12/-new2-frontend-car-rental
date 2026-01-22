import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { backendApi } from "../../../api.ts";
import {AxiosError} from "axios";

export function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await backendApi.post("/api/v1/auth/forgot-password", { email });
            if (response.status === 200) {
                alert("OTP has been sent to your email. Please check your inbox.");
                setStep('otp');
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error || "Failed to send OTP. Please try again.");
            } else {
                setError("Failed to send OTP. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await backendApi.post("/api/v1/auth/verify-otp", { email, otp });
            if (response.status === 200 && response.data.valid) {
                setStep('password');
            } else {
                setError("Invalid or expired OTP. Please try again.");
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error || "Invalid or expired OTP. Please try again.");
            } else {
                setError("Invalid or expired OTP. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        try {
            const response = await backendApi.post("/api/v1/auth/reset-password", {
                email,
                otp,
                newPassword,
            });

            if (response.status === 200) {
                alert("Password reset successfully! Please login with your new password.");
                navigate("/login");
            }

        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.error || "Failed to reset password. Please try again.");
            } else {
                setError("Failed to reset password. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-100">
            <div className="bg-white shadow-md p-8 rounded-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Forgot Password</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {step === 'email' && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <p className="text-gray-600 text-sm mb-4">
                            Enter your registered email address and we'll send you an OTP to reset your password.
                        </p>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <p className="text-gray-600 text-sm mb-4">
                            Enter the 6-digit OTP sent to <strong>{email}</strong>
                        </p>
                        <input
                            type="text"
                            name="otp"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full border border-gray-300 p-2 rounded text-center text-2xl tracking-widest"
                            maxLength={6}
                            required
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            className="w-full text-blue-600 text-sm hover:underline"
                            disabled={loading}
                        >
                            Resend OTP
                        </button>
                    </form>
                )}

                {step === 'password' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <p className="text-gray-600 text-sm mb-4">
                            Enter your new password below.
                        </p>
                        <input
                            type="password"
                            name="newPassword"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded"
                            required
                        />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded"
                            required
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStep('otp')}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                    </form>
                )}

                <p className="text-center text-sm mt-4">
                    Remember your password? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}

