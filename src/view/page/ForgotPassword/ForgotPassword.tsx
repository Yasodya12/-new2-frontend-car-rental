import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { backendApi } from "../../../api.ts";
import { AxiosError } from "axios";
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiArrowRight, HiArrowLeft, HiKey, HiCheckCircle } from 'react-icons/hi';
import { FaCar } from 'react-icons/fa';

export function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const steps = [
        { key: 'email', label: 'Email', icon: HiMail },
        { key: 'otp', label: 'Verify', icon: HiKey },
        { key: 'password', label: 'Reset', icon: HiLockClosed }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-bg-dark">
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
                <div
                    className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-[100px] animate-pulse"
                    style={{ backgroundColor: '#4F9CF9', animationDuration: '8s' }}
                ></div>
            </div>

            {/* Left Side - Hero Section */}
            <div
                className={`hidden lg:flex lg:w-1/2 relative overflow-hidden transition-all duration-1000 bg-card-dark ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
            >
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4F9CF9 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col justify-center px-20 py-12 w-full">
                    {/* Brand */}
                    <div className={`mb-12 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary shadow-[0_0_20px_rgba(79,156,249,0.3)] transition-transform hover:scale-110 hover:rotate-6">
                                <FaCar className="text-white text-2xl" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-text-light">RideHub</h1>
                        </div>
                        <h2 className="text-5xl font-extrabold mb-6 leading-tight text-text-light">
                            Reset Your <span className="text-primary">Password</span>
                        </h2>
                        <p className="text-xl text-text-muted max-w-md leading-relaxed">
                            Don't worry! We'll help you regain access to your account in just a few simple steps.
                        </p>
                    </div>

                    {/* Step Illustration */}
                    <div className={`transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                        {step === 'email' && (
                            <div className="relative">
                                <svg viewBox="0 0 400 300" className="w-full h-auto max-w-md mx-auto">
                                    <defs>
                                        <linearGradient id="emailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#4F9CF9" />
                                            <stop offset="100%" stopColor="#3B82F6" />
                                        </linearGradient>
                                    </defs>
                                    {/* Envelope */}
                                    <g transform="translate(100, 50)">
                                        <rect x="0" y="0" width="200" height="150" rx="10" fill="url(#emailGradient)" opacity="0.2" />
                                        <path d="M0 0 L100 75 L200 0 L200 150 L0 150 Z" fill="url(#emailGradient)" />
                                        <rect x="20" y="20" width="160" height="110" rx="5" fill="#0B0F19" opacity="0.8" />
                                        <circle cx="100" cy="75" r="30" fill="#4F9CF9" opacity="0.3" />
                                        {/* Mail Icon */}
                                        <path d="M80 50 L100 65 L120 50 M80 50 L80 120 L120 120 L120 50" stroke="#4F9CF9" strokeWidth="4" fill="none" strokeLinecap="round" />
                                    </g>
                                    {/* Floating Mail Icons */}
                                    <circle cx="80" cy="80" r="3" fill="#4F9CF9" opacity="0.6" className="animate-pulse" />
                                    <circle cx="320" cy="200" r="4" fill="#22C55E" opacity="0.5" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                                </svg>
                            </div>
                        )}
                        {step === 'otp' && (
                            <div className="relative">
                                <svg viewBox="0 0 400 300" className="w-full h-auto max-w-md mx-auto">
                                    <defs>
                                        <linearGradient id="otpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#22C55E" />
                                            <stop offset="100%" stopColor="#16A34A" />
                                        </linearGradient>
                                    </defs>
                                    {/* Shield */}
                                    <g transform="translate(150, 50)">
                                        <path d="M50 20 L50 60 Q50 80 70 90 L100 100 L130 90 Q150 80 150 60 L150 20 Q100 10 50 20 Z" fill="url(#otpGradient)" opacity="0.3" />
                                        <path d="M50 20 L50 60 Q50 80 70 90 L100 100 L130 90 Q150 80 150 60 L150 20 Q100 10 50 20 Z" stroke="url(#otpGradient)" strokeWidth="3" fill="none" />
                                        {/* Key Icon */}
                                        <circle cx="100" cy="60" r="8" fill="#FACC15" />
                                        <rect x="100" y="60" width="20" height="4" fill="#FACC15" />
                                        <rect x="115" y="55" width="4" height="14" fill="#FACC15" />
                                    </g>
                                    {/* Floating Numbers */}
                                    {[1, 2, 3, 4, 5, 6].map((_, i) => (
                                        <circle key={i} cx={50 + i * 50} cy={250} r="8" fill="#4F9CF9" opacity="0.3" className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                    ))}
                                </svg>
                            </div>
                        )}
                        {step === 'password' && (
                            <div className="relative">
                                <svg viewBox="0 0 400 300" className="w-full h-auto max-w-md mx-auto">
                                    <defs>
                                        <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#4F9CF9" />
                                            <stop offset="100%" stopColor="#22C55E" />
                                        </linearGradient>
                                    </defs>
                                    {/* Lock */}
                                    <g transform="translate(150, 80)">
                                        <rect x="50" y="80" width="100" height="80" rx="10" fill="url(#lockGradient)" />
                                        <path d="M70 80 L70 50 Q70 30 100 30 Q130 30 130 50 L130 80" stroke="url(#lockGradient)" strokeWidth="8" fill="none" />
                                        <circle cx="100" cy="120" r="15" fill="#0B0F19" />
                                    </g>
                                    {/* Success Checkmark */}
                                    <circle cx="200" cy="200" r="40" fill="#22C55E" opacity="0.2" />
                                    <path d="M185 200 L195 210 L215 190" stroke="#22C55E" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Graphic */}
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-bg-dark/50 to-transparent pointer-events-none"></div>
            </div>

            {/* Right Side - Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-8 relative z-10">
                <div className={`w-full max-w-md transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary">
                                <FaCar className="text-white text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-text-light">RideHub</span>
                        </div>
                        <h2 className="text-4xl font-bold text-text-light mb-3">Forgot Password?</h2>
                        <p className="text-text-muted">Follow the steps to reset your password</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            {steps.map((stepItem, index) => {
                                const StepIcon = stepItem.icon;
                                const isActive = step === stepItem.key;
                                const isCompleted = currentStepIndex > index;

                                return (
                                    <div key={stepItem.key} className="flex-1 flex flex-col items-center">
                                        <div className="relative w-full flex items-center">
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                                                        ? 'bg-accent text-white scale-110'
                                                        : isActive
                                                            ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/50'
                                                            : 'bg-card-dark border-2 border-border-dark text-text-muted'
                                                    }`}
                                            >
                                                {isCompleted ? (
                                                    <HiCheckCircle className="text-xl" />
                                                ) : (
                                                    <StepIcon className="text-xl" />
                                                )}
                                            </div>
                                            {index < steps.length - 1 && (
                                                <div
                                                    className={`absolute left-1/2 top-1/2 w-full h-0.5 -z-10 transition-all duration-500 ${isCompleted ? 'bg-accent' : 'bg-border-dark'
                                                        }`}
                                                    style={{ width: 'calc(100% - 3rem)', left: 'calc(50% + 1.5rem)' }}
                                                ></div>
                                            )}
                                        </div>
                                        <span className={`text-xs mt-2 font-semibold transition-colors ${isActive ? 'text-primary' : isCompleted ? 'text-accent' : 'text-text-muted'
                                            }`}>
                                            {stepItem.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Login Card */}
                    <div className="bg-card-dark/80 backdrop-blur-xl rounded-[2rem] border border-border-dark p-10 shadow-2xl relative overflow-hidden group">
                        {/* Subtle inner highlight */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>

                        {/* Decorative Background Pattern */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4F9CF9" strokeWidth="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="relative z-10 mb-6 p-4 rounded-xl border border-danger/50 bg-danger/10 backdrop-blur-sm">
                                <p className="text-danger text-sm font-medium flex items-center gap-2">
                                    <span className="text-lg">⚠</span>
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Step 1: Email */}
                        {step === 'email' && (
                            <form onSubmit={handleSendOTP} className="relative z-10 space-y-6">
                                <div className="text-center mb-6">
                                    <p className="text-text-muted leading-relaxed">
                                        Enter your registered email address and we'll send you a verification code to reset your password.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">Email Address</label>
                                    <div className="relative group">
                                        <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full bg-bg-dark/50 border border-border-dark rounded-xl py-4 pl-12 pr-4 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-text-muted/50"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>Send Verification Code</span>
                                            <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 'otp' && (
                            <form onSubmit={handleVerifyOTP} className="relative z-10 space-y-6">
                                <div className="text-center mb-6">
                                    <p className="text-text-muted leading-relaxed mb-2">
                                        Enter the 6-digit code sent to
                                    </p>
                                    <p className="text-primary font-semibold">{email}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">Verification Code</label>
                                    <div className="relative group">
                                        <HiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            name="otp"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            className="w-full bg-bg-dark/50 border border-border-dark rounded-xl py-4 pl-12 pr-4 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-text-muted/50 text-center text-3xl tracking-[0.5em] font-bold"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-text-muted text-center mt-2">Enter the 6-digit code</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep('email')}
                                        className="flex-1 bg-card-dark border-2 border-border-dark text-text-light font-semibold py-4 rounded-xl hover:bg-bg-dark/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <HiArrowLeft />
                                        <span>Back</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || otp.length !== 6}
                                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <span>Verify Code</span>
                                                <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    className="w-full text-primary text-sm font-semibold hover:underline transition-all disabled:opacity-50"
                                    disabled={loading}
                                >
                                    Didn't receive code? Resend
                                </button>
                            </form>
                        )}

                        {/* Step 3: New Password */}
                        {step === 'password' && (
                            <form onSubmit={handleResetPassword} className="relative z-10 space-y-6">
                                <div className="text-center mb-6">
                                    <p className="text-text-muted leading-relaxed">
                                        Create a strong password for your account. Make sure it's at least 6 characters long.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">New Password</label>
                                    <div className="relative group">
                                        <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="newPassword"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="w-full bg-bg-dark/50 border border-border-dark rounded-xl py-4 pl-12 pr-12 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-text-muted/50"
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

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-muted ml-1 uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative group">
                                        <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-muted group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="w-full bg-bg-dark/50 border border-border-dark rounded-xl py-4 pl-12 pr-12 text-text-light focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all placeholder:text-text-muted/50"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light transition-colors"
                                        >
                                            {showConfirmPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                                        </button>
                                    </div>
                                    {newPassword && confirmPassword && (
                                        <p className={`text-xs mt-1 ml-1 flex items-center gap-1 ${newPassword === confirmPassword && newPassword.length >= 6
                                                ? 'text-accent'
                                                : 'text-danger'
                                            }`}>
                                            {newPassword === confirmPassword && newPassword.length >= 6 ? (
                                                <>
                                                    <HiCheckCircle /> Passwords match
                                                </>
                                            ) : (
                                                <>
                                                    <span>⚠</span> {newPassword.length < 6 ? 'Password must be at least 6 characters' : 'Passwords do not match'}
                                                </>
                                            )}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep('otp')}
                                        className="flex-1 bg-card-dark border-2 border-border-dark text-text-light font-semibold py-4 rounded-xl hover:bg-bg-dark/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <HiArrowLeft />
                                        <span>Back</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                                        className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <span>Reset Password</span>
                                                <HiCheckCircle className="group-hover:scale-110 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    <p className="text-center mt-8 text-text-muted">
                        Remember your password? <Link to="/login" className="text-primary font-bold hover:underline transition-all">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

