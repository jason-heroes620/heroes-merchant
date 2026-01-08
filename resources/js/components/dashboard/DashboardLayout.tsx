import React from "react";
import { Home } from "lucide-react";

interface LayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    userRole: "admin" | "merchant";
}

const DashboardLayout: React.FC<LayoutProps> = ({
    children,
    title,
    subtitle,
    userRole,
}) => {
    const date = new Date();

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-orange-50">
            {/* Header */}
            <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {userRole === "merchant" && (
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <Home size={32} className="text-white" />
                            </div>
                        )}
                        <div>
                            <h1
                                className={`${
                                    userRole === "merchant"
                                        ? "text-4xl"
                                        : "text-3xl"
                                } font-bold mb-1`}
                            >
                                {title}
                            </h1>
                            {userRole === "merchant" && (
                                <p className="text-orange-100">
                                    {subtitle ||
                                        "Welcome back! Here's your business overview"}
                                </p>
                            )}
                            {userRole === "admin" && subtitle && (
                                <p className="text-orange-100 mt-1">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
                        <div className="text-sm text-orange-100 mb-1">
                            {date.toLocaleDateString("en-US", {
                                weekday: "long",
                                timeZone: "Asia/Kuala_Lumpur",
                            })}
                        </div>
                        <div className="text-lg font-semibold">
                            {date.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                timeZone: "Asia/Kuala_Lumpur",
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;
