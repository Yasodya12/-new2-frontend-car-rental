import { useState } from "react";
import {Link, useNavigate} from "react-router-dom";
import {backendApi} from "../../../api.ts";
import {getUserFromToken} from "../../../auth/auth.ts";
import type {UserData} from "../../../Model/userData.ts";

export function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await backendApi.post("/api/v1/auth/login", form);

            const accessToken = response.data.accessToken;
            const refreshToken = response.data.refreshToken;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);

            const user:UserData = getUserFromToken(accessToken);

            localStorage.setItem('userName', user.name);
            localStorage.setItem('role', user.role);

            const userAgent = navigator.userAgent;
            const loginTime = new Date().toLocaleString();


            if (user.role === 'customer' || user.role === 'driver') {
                alert("Login successful.");
                navigate("/home");
            } else if (user.role === 'admin') {
                alert("Login successful.");
                navigate("/dashboard");
            }

            try {
                await backendApi.post("/api/v1/email/send-login-notification", {
                    to: user.email,
                    subject: "Login Alert",
                    message: `Successful login detected for your account (${user.name}) at ${loginTime}.`,
                    userAgent: userAgent,
                });
            } catch (emailError) {
                console.warn("Failed to send login notification email:", emailError);
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-100">
            <div className="bg-white shadow-md p-8 rounded-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                        Login
                    </button>
                </form>
                <p className="text-center text-sm mt-2">
                    <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot Password?</Link>
                </p>
                <p className="text-center text-sm mt-4">
                    Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
                </p>
            </div>
        </div>
    );
}

