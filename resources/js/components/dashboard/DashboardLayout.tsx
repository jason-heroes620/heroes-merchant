import React from "react";
import { Home } from "lucide-react";

interface LayoutProps {
    children: React.ReactNode;
    title: string;
    userRole: "admin" | "merchant";
}

const DashboardLayout: React.FC<LayoutProps> = ({ children, title }) => {
    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-orange-50">
            {/* Header */}
            <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <Home size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold mb-1">{title}</h1>
                                <p className="text-orange-100">
                                    Welcome back! Here's your business overview
                                </p>
                            </div>
                        </div>
                        <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
                            <div className="text-sm text-orange-100 mb-1">
                                {typeof Date !== "undefined" &&
                                    new Date().toLocaleDateString("en-US", {
                                        weekday: "long",
                                        timeZone: "Asia/Kuala_Lumpur",
                                    })}
                            </div>
                            <div className="text-lg font-semibold">
                                {typeof Date !== "undefined" &&
                                    new Date().toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        timeZone: "Asia/Kuala_Lumpur",
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">{children}</div>
        </div>
    );
};

export default DashboardLayout;

