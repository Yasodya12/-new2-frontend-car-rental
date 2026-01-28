import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendApi } from "../../../api.ts";

export function ChangePassword() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.newPassword !== form.confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (form.newPassword.length < 6) {
            setError("New password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        try {
            await backendApi.post("/api/v1/auth/change-password", {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword
            });
            setSuccess(true);
            setTimeout(() => {
                navigate("/user");
            }, 2000);
        } catch (err: any) {
            console.error("Change password error:", err);
            setError(err.response?.data?.error || "Failed to change password. Please check your current password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-card-dark rounded-[2.5rem] border border-border-dark p-10 shadow-xl relative overflow-hidden">
                <div className="relative text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary text-2xl mb-4 shadow-sm">
                        🔐
                    </div>
                    <h2 className="text-3xl font-extrabold text-text-light tracking-tight mb-2">
                        Security Update
                    </h2>
                    <p className="text-sm text-text-muted font-medium px-4">
                        Update your credentials to maintain the operational integrity of your fleet account.
                    </p>
                </div>

                {success ? (
                    <div className="bg-accent/10 border border-accent/20 text-accent p-6 rounded-2xl text-center space-y-2">
                        <p className="font-bold uppercase tracking-widest text-xs">System Synchronized</p>
                        <p className="text-sm font-semibold italic">Credentials updated successfully. Redirecting...</p>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl text-xs font-bold text-center">
                                ERROR: {error}
                            </div>
                        )}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Current Password</label>
                                <input
                                    name="oldPassword"
                                    type="password"
                                    required
                                    value={form.oldPassword}
                                    onChange={handleChange}
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-5 py-3.5 text-sm text-text-light placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm font-semibold"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">New Password</label>
                                <input
                                    name="newPassword"
                                    type="password"
                                    required
                                    value={form.newPassword}
                                    onChange={handleChange}
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-5 py-3.5 text-sm text-text-light placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm font-semibold"
                                    placeholder="Minimum 6 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Confirm New Password</label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-5 py-3.5 text-sm text-text-light placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm font-semibold"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Updating...
                                    </span>
                                ) : "Commit Security Change"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-colors"
                    >
                        ← Return to Account
                    </button>
                </div>
            </div>
        </div>
    );
}
