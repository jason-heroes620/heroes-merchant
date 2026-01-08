import { useState, useEffect } from "react";
import { router, usePage, Link } from "@inertiajs/react";
import Cookies from "js-cookie";
import { LogOut, User as UserIcon } from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import Loading from "@/components/ui/loading";
import { Toaster } from "@/components/ui/sonner";
import ResponsiveNavLink from "@/components/ui/ResponsiveNavLink";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
    const page = usePage();
    const user = page.props.auth?.user;

    const defaultOpen =
        Cookies.get("sidebar_state") === "true" ||
        Cookies.get("sidebar_state") === undefined;

    const [loading, setLoading] = useState(false);
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleFinish = (event: any) => {
            if (event.detail.visit.completed) setLoading(false);
        };

        router.on("start", handleStart);
        router.on("finish", handleFinish);
    }, []);

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />

            <SidebarInset>
                <header className="sticky top-0 z-50 border-b border-orange-100/50 bg-white/90 backdrop-blur-xl shadow-sm">
                    <nav className="px-4 lg:px-6">
                        <div className="flex h-16 items-center justify-between">
                            {/* Left Section */}
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200" />
                            </div>

                            {/* Right Section */}
                            {user && (
                                <div className="hidden sm:flex sm:items-center sm:gap-3">
                                    {/* User Dropdown */}
                                    {/* <Dropdown>
                                        <Dropdown.Trigger>
                                            <button className="group flex items-center gap-3 rounded-xl border border-orange-200/60 bg-white px-4 py-2.5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-orange-300 hover:bg-linear-to-r hover:from-orange-50 hover:to-red-50">
                                                <div className="relative">
                                                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center text-white font-bold shadow-md text-sm ring-2 ring-white">
                                                        {user.full_name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-semibold text-gray-800 group-hover:text-orange-700 transition-colors">
                                                        {user.full_name}
                                                    </div>
                                                    <div className="text-xs text-orange-600 capitalize">
                                                        {user.role}
                                                    </div>
                                                </div>
                                                <ChevronDown className="w-4 h-4 text-orange-500 transition-transform duration-200 group-hover:translate-y-0.5" />
                                            </button>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-linear-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700 transition-all duration-200 rounded-md mx-1"
                                            >
                                                <UserIcon className="w-4 h-4" />
                                                <span className="font-medium">
                                                    Profile
                                                </span>
                                            </Link>

                                            <div className="my-1 h-px bg-linear-to-r from-transparent via-orange-200 to-transparent"></div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post("/logout")
                                                }
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-linear-to-r hover:from-red-50 hover:to-orange-50 hover:text-red-600 transition-all duration-200 rounded-md mx-1"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span className="font-medium">
                                                    Log Out
                                                </span>
                                            </button>
                                        </Dropdown.Content>
                                    </Dropdown> */}
                                    <NavigationMenu>
                                        <NavigationMenuList>
                                            <NavigationMenuItem className="hidden md:block">
                                                <NavigationMenuTrigger>
                                                    <div className="relative">
                                                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center text-white font-bold shadow-md text-sm ring-2 ring-white">
                                                            {user.full_name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                                                    </div>
                                                    <div className="pl-4">
                                                        <div className="text-left">
                                                            <div className="text-sm font-semibold text-gray-800 group-hover:text-orange-700 transition-colors">
                                                                {user.full_name}
                                                            </div>
                                                            <div className="text-xs text-orange-600 capitalize">
                                                                {user.role}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </NavigationMenuTrigger>
                                                <NavigationMenuContent>
                                                    <ul className="grid w-[200px] gap-4">
                                                        <li>
                                                            <NavigationMenuLink
                                                                asChild
                                                            >
                                                                <Link
                                                                    href="/profile"
                                                                    className="flex-row items-center gap-2"
                                                                >
                                                                    <UserIcon className="w-4 h-4" />
                                                                    <span className="font-medium">
                                                                        Profile
                                                                    </span>
                                                                </Link>
                                                            </NavigationMenuLink>
                                                            <NavigationMenuLink
                                                                asChild
                                                            >
                                                                <Link
                                                                    type="button"
                                                                    onClick={() =>
                                                                        router.post(
                                                                            "/logout"
                                                                        )
                                                                    }
                                                                    className="flex-row items-center gap-2"
                                                                >
                                                                    <LogOut className="w-4 h-4" />
                                                                    <span className="font-medium">
                                                                        Log Out
                                                                    </span>
                                                                </Link>
                                                            </NavigationMenuLink>
                                                        </li>
                                                    </ul>
                                                </NavigationMenuContent>
                                            </NavigationMenuItem>
                                        </NavigationMenuList>
                                    </NavigationMenu>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <div className="-me-2 flex items-center sm:hidden">
                                <button
                                    onClick={() =>
                                        setShowingNavigationDropdown(
                                            (prev) => !prev
                                        )
                                    }
                                    className="inline-flex items-center justify-center rounded-lg p-2.5 text-orange-600 hover:bg-orange-50 hover:text-orange-700 focus:outline-none transition-colors duration-200"
                                >
                                    <svg
                                        className="h-6 w-6"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            className={
                                                !showingNavigationDropdown
                                                    ? "inline-flex"
                                                    : "hidden"
                                            }
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                        <path
                                            className={
                                                showingNavigationDropdown
                                                    ? "inline-flex"
                                                    : "hidden"
                                            }
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </nav>

                    {/* Mobile Dropdown */}
                    {user && showingNavigationDropdown && (
                        <div className="sm:hidden border-t border-orange-100 bg-linear-to-br from-orange-50/80 to-red-50/50 backdrop-blur-sm">
                            <div className="px-4 pt-4 pb-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 shadow-sm">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                                            {user.full_name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-gray-800">
                                            {user.full_name}
                                        </div>
                                        <div className="text-sm text-orange-600">
                                            {user.email}
                                        </div>
                                        <div className="text-xs text-gray-500 capitalize mt-0.5">
                                            {user.role}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 px-4 pb-4">
                                <ResponsiveNavLink href="/profile">
                                    <div className="flex items-center gap-3">
                                        <UserIcon className="w-4 h-4" />
                                        <span>Profile</span>
                                    </div>
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    href="/logout"
                                    method="post"
                                    as="button"
                                >
                                    <div className="flex items-center gap-3">
                                        <LogOut className="w-4 h-4" />
                                        <span>Log Out</span>
                                    </div>
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    )}
                </header>

                <main className="relative min-h-screen bg-linear-to-br from-orange-50/20 via-white to-red-50/20">
                    {loading && <Loading />}
                    <div className="p-4 md:p-6 lg:p-8">
                        {!loading && children}
                    </div>
                </main>
            </SidebarInset>

            <Toaster />
        </SidebarProvider>
    );
};

export default AuthenticatedLayout;
