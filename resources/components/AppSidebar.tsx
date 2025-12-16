import { useEffect, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Calendar,
    Users,
    User,
    LayoutDashboard,
    Banknote,
    Bell,
    Settings,
    UserPlus,
    ShoppingCart,
    TrendingUp,
    Package,
    ChevronRight,
    Building2,
} from "lucide-react";

type SidebarLink = {
    key: string;
    label: string;
    icon: React.ElementType;
    href: string;
    badge?: string;
};

type SidebarCollapsible = {
    key: string;
    label: string;
    icon: React.ElementType;
    subItems: SidebarLink[];
};

type SidebarItem = SidebarLink | SidebarCollapsible;

type SidebarGroupType = {
    group: string;
    items: SidebarItem[];
};

export function AppSidebar() {
    const { state } = useSidebar();
    const { url, props } = usePage();
    const user = props?.auth?.userRole;

    if (!user) return null;
    const rolePrefix = user === "admin" ? "/admin" : "/merchant";

    const adminGroups: SidebarGroupType[] = [
        {
            group: "Main",
            items: [
                {
                    key: "dashboard",
                    label: "Dashboard",
                    icon: LayoutDashboard,
                    href: `${rolePrefix}/dashboard`,
                },
            ],
        },
        {
            group: "Management",
            items: [
                {
                    key: "merchants",
                    label: "Merchants",
                    icon: Building2,
                    subItems: [
                        {
                            key: "merchants-list",
                            label: "All Merchants",
                            icon: Building2,
                            href: `${rolePrefix}/merchants`,
                        },
                        {
                            key: "merchants-create",
                            label: "Add Merchant",
                            icon: UserPlus,
                            href: `${rolePrefix}/merchants/create`,
                        },
                    ],
                },
                {
                    key: "customers",
                    label: "Customers",
                    icon: Users,
                    subItems: [
                        {
                            key: "customers-list",
                            label: "All Customers",
                            icon: Users,
                            href: `${rolePrefix}/customers`,
                        },
                        {
                            key: "customers-create",
                            label: "Add Customer",
                            icon: UserPlus,
                            href: `${rolePrefix}/customers/create`,
                        },
                    ],
                },
            ],
        },
        {
            group: "Operations",
            items: [
                {
                    key: "events",
                    label: "Events",
                    icon: Calendar,
                    href: `${rolePrefix}/events`,
                },
                {
                    key: "bookings",
                    label: "Bookings",
                    icon: ShoppingCart,
                    href: `${rolePrefix}/bookings`,
                },
            ],
        },
        {
            group: "Financial",
            items: [
                {
                    key: "conversions",
                    label: "Conversions",
                    icon: TrendingUp,
                    subItems: [
                        {
                            key: "conversions-list",
                            label: "All Conversions",
                            icon: TrendingUp,
                            href: `${rolePrefix}/conversions`,
                        },
                        {
                            key: "conversions-create",
                            label: "Add Conversion",
                            icon: UserPlus,
                            href: `${rolePrefix}/conversions/create`,
                        },
                    ],
                },
                {
                    key: "packages",
                    label: "Packages",
                    icon: Package,
                    href: `${rolePrefix}/packages`,
                },
                {
                    key: "payouts",
                    label: "Payouts",
                    icon: Banknote,
                    href: `${rolePrefix}/payouts`,
                },
            ],
        },
        {
            group: "System",
            items: [
                {
                    key: "notifications",
                    label: "Notifications",
                    icon: Bell,
                    href: "/notifications",
                },
                {
                    key: "settings",
                    label: "Settings",
                    icon: Settings,
                    href: `${rolePrefix}/settings`,
                },
                {
                    key: "profile",
                    label: "Profile",
                    icon: User,
                    href: "/profile",
                },
            ],
        },
    ];

    const merchantGroups: SidebarGroupType[] = [
        {
            group: "Main",
            items: [
                {
                    key: "dashboard",
                    label: "Dashboard",
                    icon: LayoutDashboard,
                    href: `${rolePrefix}/dashboard`,
                },
            ],
        },
        {
            group: "Operations",
            items: [
                {
                    key: "events",
                    label: "Events",
                    icon: Calendar,
                    subItems: [
                        {
                            key: "events-list",
                            label: "My Events",
                            icon: Calendar,
                            href: `${rolePrefix}/events`,
                        },
                        {
                            key: "events-create",
                            label: "Create Event",
                            icon: UserPlus,
                            href: `${rolePrefix}/events/create`,
                        },
                    ],
                },
                {
                    key: "bookings",
                    label: "Bookings",
                    icon: ShoppingCart,
                    href: `${rolePrefix}/bookings`,
                },
            ],
        },
        {
            group: "Financial",
            items: [
                {
                    key: "payouts",
                    label: "Payouts",
                    icon: Banknote,
                    href: `${rolePrefix}/payouts`,
                },
            ],
        },
        {
            group: "System",
            items: [
                {
                    key: "notifications",
                    label: "Notifications",
                    icon: Bell,
                    href: "/notifications",
                },
                {
                    key: "profile",
                    label: "Profile",
                    icon: User,
                    href: "/profile",
                },
            ],
        },
    ];

    const sidebarGroups = user === "admin" ? adminGroups : merchantGroups;

    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
        {}
    );
    const activeItemRef = useRef<HTMLAnchorElement>(null);

    const toggleExpand = (key: string) => {
        setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const isActive = (href: string) =>
        url === href || (href !== "/" && url.startsWith(href));

    useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [url]);

    useEffect(() => {
        const initialExpanded: Record<string, boolean> = {};
        sidebarGroups.forEach((group) => {
            group.items.forEach((item) => {
                if ("subItems" in item) {
                    const active = item.subItems.some((sub) =>
                        isActive(sub.href)
                    );
                    if (active) initialExpanded[item.key] = true;
                }
            });
        });
        setExpandedItems(initialExpanded);
    }, [url]);

    return (
        <ScrollArea className="h-full">
            <Sidebar
                side="left"
                collapsible="icon"
                variant="sidebar"
                className="border-r border-orange-100/60 bg-linear-to-b from-white via-orange-50/30 to-white"
            >
                <SidebarContent className="pt-2">
                    {/* Logo Section */}
                    <div className="px-3 py-4 mb-1">
                        {state === "expanded" ? (
                            <div className="flex items-center gap-3 px-2">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-xl bg-linear-to-br from-orange-500 via-orange-600 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                        <Calendar
                                            className="w-6 h-6 text-white"
                                            strokeWidth={2.5}
                                        />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-black text-xl bg-linear-to-r from-orange-600 via-orange-500 to-red-600 bg-clip-text text-transparent tracking-tight">
                                        HEROES
                                    </h2>
                                    <p className="text-[10px] font-semibold text-orange-600/80 uppercase tracking-wider">
                                        Event Manager
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-xl bg-linear-to-br from-orange-500 via-orange-600 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                        <Calendar
                                            className="w-6 h-6 text-white"
                                            strokeWidth={2.5}
                                        />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Groups */}
                    {sidebarGroups.map((group) => (
                        <SidebarGroup key={group.group}>
                            <SidebarGroupLabel className="text-[10px] font-bold text-orange-600/70 uppercase tracking-widest px-4">
                                {group.group}
                            </SidebarGroupLabel>
                            {group.items.map((item) => (
                                <SidebarMenu key={item.key}>
                                    {"subItems" in item ? (
                                        <Collapsible
                                            className="group/collapsible"
                                            open={
                                                expandedItems[item.key] ?? false
                                            }
                                            onOpenChange={() =>
                                                toggleExpand(item.key)
                                            }
                                        >
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuItem>
                                                    <SidebarMenuButton
                                                        tooltip={item.label}
                                                        isActive={item.subItems.some(
                                                            (sub) =>
                                                                isActive(
                                                                    sub.href
                                                                )
                                                        )}
                                                        className="group relative overflow-hidden hover:bg-linear-to-r hover:from-orange-50 hover:to-red-50 data-[active=true]:bg-linear-to-r data-[active=true]:from-orange-500 data-[active=true]:to-red-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-orange-500/30 transition-all duration-300 rounded-lg"
                                                    >
                                                        <div className="absolute inset-0 bg-linear-to-r from-orange-400/0 via-white/20 to-orange-400/0 translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                                        <item.icon
                                                            className="w-5 h-5 relative z-10"
                                                            strokeWidth={2.2}
                                                        />
                                                        <span className="font-semibold text-sm relative z-10">
                                                            {item.label}
                                                        </span>
                                                        <ChevronRight
                                                            className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 relative z-10"
                                                            strokeWidth={2.5}
                                                        />
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub className="ml-4 border-l-2 border-orange-200/50">
                                                    {item.subItems.map(
                                                        (sub) => (
                                                            <SidebarMenuSubItem
                                                                key={sub.key}
                                                            >
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isActive(
                                                                        sub.href
                                                                    )}
                                                                    ref={
                                                                        isActive(
                                                                            sub.href
                                                                        )
                                                                            ? activeItemRef
                                                                            : null
                                                                    }
                                                                    className="hover:bg-orange-50 data-[active=true]:bg-linear-to-r data-[active=true]:from-orange-100 data-[active=true]:to-red-100 data-[active=true]:text-orange-700 data-[active=true]:font-bold data-[active=true]:border-l-2 data-[active=true]:border-orange-500 transition-all duration-200 rounded-r-lg"
                                                                >
                                                                    <Link
                                                                        href={
                                                                            sub.href
                                                                        }
                                                                        className="flex items-center gap-2.5"
                                                                    >
                                                                        <sub.icon
                                                                            className="w-4 h-4"
                                                                            strokeWidth={
                                                                                2.2
                                                                            }
                                                                        />
                                                                        <span className="text-sm">
                                                                            {
                                                                                sub.label
                                                                            }
                                                                        </span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        )
                                                    )}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ) : (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                tooltip={item.label}
                                                isActive={isActive(item.href)}
                                                className="group relative overflow-hidden hover:bg-linear-to-r hover:from-orange-50 hover:to-red-50 data-[active=true]:bg-linear-to-r data-[active=true]:from-orange-500 data-[active=true]:to-red-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-orange-500/30 transition-all duration-300 rounded-lg"
                                            >
                                                <Link
                                                    href={item.href}
                                                    ref={
                                                        isActive(item.href)
                                                            ? activeItemRef
                                                            : null
                                                    }
                                                    className="flex items-center gap-3 w-full"
                                                >
                                                    <div className="absolute inset-0 bg-linear-to-r from-orange-400/0 via-white/20 to-orange-400/0 translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                                    <item.icon
                                                        className="w-5 h-5 relative z-10"
                                                        strokeWidth={2.2}
                                                    />
                                                    <span className="font-semibold text-sm relative z-10">
                                                        {item.label}
                                                    </span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                </SidebarMenu>
                            ))}
                        </SidebarGroup>
                    ))}
                </SidebarContent>

                {/* Footer */}
                <SidebarFooter className="border-t border-orange-100 bg-linear-to-b from-transparent to-orange-50/40">
                    {state === "expanded" ? (
                        <div className="p-4">
                            <div className="text-center space-y-1">
                                <p className="text-xs font-bold text-orange-600">
                                    &copy; 2025 HEROES Malaysia
                                </p>
                                <p className="text-[10px] text-orange-500">
                                    Event Management Platform
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-2">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-orange-600">
                                    &copy;
                                </p>
                            </div>
                        </div>
                    )}
                </SidebarFooter>
            </Sidebar>
        </ScrollArea>
    );
}
