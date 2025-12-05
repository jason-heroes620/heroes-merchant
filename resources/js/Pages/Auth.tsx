import React, { useState, useEffect } from "react";
import { Inertia } from "@inertiajs/inertia";
import { Head, usePage } from "@inertiajs/react";

const Auth: React.FC = () => {
    const { errors } = usePage().props as { errors?: Record<string, string> };

    const queryParams = new URLSearchParams(window.location.search);
    const isRegisterMode = queryParams.get("mode") === "register";

    const [isLogin, setIsLogin] = useState(!isRegisterMode);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const newUrl = `${window.location.pathname}?mode=${
            isLogin ? "login" : "register"
        }`;
        window.history.replaceState(null, "", newUrl);
    }, [isLogin]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            alert("Please fill in all required fields.");
            return;
        }

        if (!isLogin) {
            if (!fullName || !companyName) {
                alert("Please fill in your full name and company name.");
                return;
            }

            if (password !== passwordConfirmation) {
                alert("Passwords do not match!");
                return;
            }

            if (password.length < 8) {
                alert("Password must be at least 8 characters long.");
                return;
            }
        }

        const data: Record<string, string> = { email, password };

        if (!isLogin) {
            data.full_name = fullName;
            data.company_name = companyName;
            data.password_confirmation = passwordConfirmation;
        }

        const route = isLogin ? "/login" : "/register";

        setLoading(true);

        Inertia.post(route, data, {
            onError: (err) => {
                setLoading(false);
                console.error("Validation error:", err);
                const messages = Object.values(err).join("\n");
                alert(messages || "Please correct the errors and try again.");
            },
            onSuccess: () => {
                setLoading(false);
            },
        });
    };

    return (
        <div className="flex min-h-screen">
            <Head title={isLogin ? "Login" : "Register"} />

            {/* Left Panel - Brand Section */}
            <div className="hidden lg:flex lg:w-1/3 bg-linear-to-br from-orange-400 via-orange-500 to-orange-600 p-12 flex-col justify-center relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Welcome to Heroes
                    </h1>
                    <p className="text-orange-100 text-lg leading-relaxed">
                        Your all-in-one platform for managing events and
                        streamline operations
                    </p>
                </div>
            </div>

            {/* Right Panel - Form Section */}
            <div className="w-full lg:w-2/3 flex flex-col items-center justify-center p-8 bg-gray-50">
                <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
                    {/* Tab Headers */}
                    <div className="flex mb-8 border-b">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 pb-3 text-center font-medium transition ${
                                isLogin
                                    ? "text-orange-500 border-b-2 border-orange-500"
                                    : "text-gray-500"
                            }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 pb-3 text-center font-medium transition ${
                                !isLogin
                                    ? "text-orange-500 border-b-2 border-orange-500"
                                    : "text-gray-500"
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {/* Form Title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {isLogin ? "Welcome back" : "Create your account"}
                        </h2>
                        <p className="text-gray-600 text-sm">
                            {isLogin
                                ? "Enter your credentials to access your account"
                                : "Join our community of successful event merchants"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Your Full Name"
                                        value={fullName}
                                        onChange={(e) =>
                                            setFullName(e.target.value)
                                        }
                                        className="border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-2">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Your Company"
                                        value={companyName}
                                        onChange={(e) =>
                                            setCompanyName(e.target.value)
                                        }
                                        className="border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="youremail@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                            {errors?.email && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                            {errors?.password && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={passwordConfirmation}
                                    onChange={(e) =>
                                        setPasswordConfirmation(e.target.value)
                                    }
                                    className="border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>
                        )}

                        {isLogin && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) =>
                                            setRememberMe(e.target.checked)
                                        }
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Remember me
                                    </span>
                                </label>
                                <button
                                    type="button"
                                    className="text-sm text-orange-500 hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`${
                                loading
                                    ? "bg-orange-300"
                                    : "bg-orange-500 hover:bg-orange-600"
                            } text-white w-full py-3 rounded-lg transition font-medium`}
                        >
                            {loading
                                ? "Please wait..."
                                : isLogin
                                ? "Sign in to your account"
                                : "Create account"}
                        </button>
                        {!isLogin && (
                            <p className="text-xs text-gray-500 text-center mt-4">
                                By registering, you agree to our Terms of
                                Service and Privacy Policy
                            </p>
                        )}
                    </form>
                </div>
                <p className="text-center text-sm text-gray-600 mt-6">
                    {isLogin ? "New to Heroes?" : "Already have an account?"}{" "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                        {isLogin ? "Create an account" : "Sign in"}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;
