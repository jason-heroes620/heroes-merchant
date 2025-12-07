import type { PropsWithChildren } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import type { PageProps } from "../types";

export default function AppLayout({ children }: PropsWithChildren) {
    const { auth, url } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!auth?.user) return null; // Just render nothing if user is missing

    const user = auth.user;
    const currentUrl = url ?? "";
    const isActive = (pattern: string) => currentUrl.startsWith(pattern);

    const onLogout = () => router.post("/logout");

    // Role-based menus
    const adminMenu = [
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Merchants", href: "/admin/merchants" },
        { label: "Customers", href: "/admin/customers" },
        { label: "Events", href: "/admin/events" },
        { label: "Conversions", href: "/admin/conversions" },
        { label: "Packages", href: "/admin/packages" },
        { label: "Bookings", href: "/admin/bookings" },
        { label: "Payouts", href: "/admin/payouts" },
        { label: "Notifications", href: "/notifications" },
    ].map((item) => ({ ...item, active: isActive(item.href) }));

    const merchantMenu = [
        { label: "Dashboard", href: "/merchant/dashboard" },
        { label: "Events", href: "/merchant/events" },
        { label: "Bookings", href: "/merchant/bookings" },
        { label: "Payouts", href: "/merchant/payouts" },
        { label: "Notifications", href: "/notifications" },
        { label: "Profile", href: "/profile" },
    ].map((item) => ({ ...item, active: isActive(item.href) }));

    const menu = user.role === "admin" ? adminMenu : merchantMenu;

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={`fixed z-40 inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0`}
            >
                <div className="p-4 border-b flex items-center justify-between md:block">
                    <h1 className="text-lg font-semibold">
                        {user.role === "admin"
                            ? "Admin Panel"
                            : "Merchant Panel"}
                    </h1>
                    <button
                        type="button"
                        className="md:hidden p-2"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>
                <nav className="p-4 space-y-1">
                    {menu.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-4 py-2 rounded-lg font-medium transition ${
                                item.active
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-200"
                            }`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    role="button"
                    tabIndex={0}
                    className="fixed inset-0 bg-black/30 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    onKeyDown={(e) =>
                        e.key === "Escape" && setSidebarOpen(false)
                    }
                />
            )}

            {/* Main content */}
            <div className="flex-1 md:ml-64">
                <header className="bg-white shadow sticky top-0 z-20">
                    <div className="flex items-center justify-between px-4 h-16">
                        <button
                            type="button"
                            className="md:hidden p-2"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={22} />
                        </button>
                        <h2 className="text-lg font-semibold">
                            {user.full_name}
                        </h2>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700"
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </header>

                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
