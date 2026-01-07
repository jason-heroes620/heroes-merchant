import { useState } from "react";
import type { PageProps } from "../../types/index";
import { usePage, router } from "@inertiajs/react";
import {
    Calendar,
    Plus,
    Search,
    Filter,
    Grid3x3,
    List,
    CheckCircle,
    Clock,
    BadgeX,
    XCircle,
    AlertCircle,
} from "lucide-react";
import type { EventType, EventSlotPrice } from "../../types/events";
import TableView from "../../components/events/index/TableView";
import GridView from "../../components/events/index/GridView";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface EventsProps extends PageProps {
    events: {
        data: EventType[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    role: string;
    selectedMerchant?: string | null;
}

export default function EventsIndexPage() {
    const { props } = usePage<EventsProps>();
    const { events, role: userRole } = props;

    const [searchQuery, setSearchQuery] = useState("");
    const [merchantQuery, setMerchantQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
    const upcomingEvents = events.data.filter((ev) => ev.is_upcoming);
    const pastEvents = events.data.filter((ev) => ev.is_past);

    const filteredEvents = events.data.filter((event) => {
        // Filter by tab first
        const isTabMatch =
            tab === "upcoming" ? event.is_upcoming : event.is_past;

        // Filter by search query
        const matchesSearch =
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category?.toLowerCase().includes(searchQuery.toLowerCase());

        // Filter by merchant (admin only)
        const matchesMerchant =
            merchantQuery.trim() === "" ||
            (userRole === "admin" &&
                (event.merchant?.company_name
                    ?.toLowerCase()
                    .includes(merchantQuery.toLowerCase()) ||
                    event.merchant?.id?.includes(merchantQuery)));

        // Filter by status
        const matchesStatus =
            statusFilter === "all" || event.status === statusFilter;

        // Filter by type
        const matchesType = typeFilter === "all" || event.type === typeFilter;

        // Return only if all match
        return (
            isTabMatch &&
            matchesSearch &&
            matchesMerchant &&
            matchesStatus &&
            matchesType
        );
    });

    const statusColors = {
        active: {
            bg: "bg-green-100",
            text: "text-green-800",
            icon: CheckCircle,
        },
        pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
        inactive: { bg: "bg-gray-100", text: "text-gray-800", icon: BadgeX },
        rejected: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
        draft: { bg: "bg-blue-100", text: "text-blue-800", icon: AlertCircle },
    } as const;

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            workshop: "Event / Workshop",
            trial: "Trial Class",
            pass: "Ticket / Pass",
        };
        return labels[type] || type;
    };

    const getPriceRange = (
        slots?: EventSlotPrice[],
        userRole?: "admin" | "merchant",
        eventStatus?: string
    ) => {
        if (!slots?.length) return "Free";

        const prices = slots
            .map((s) => s.price_in_rm)
            .filter((v): v is number => v != null);
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;
        const priceText =
            minPrice === maxPrice
                ? `RM ${minPrice.toFixed(2)}`
                : `RM ${minPrice.toFixed(2)} - RM ${maxPrice.toFixed(2)}`;

        if (userRole === "admin" && eventStatus === "active") {
            // Free credits
            const freeCredits = slots
                .map((s) => s.free_credits ?? 0)
                .filter((v) => v != null);
            const minFree = freeCredits.length ? Math.min(...freeCredits) : 0;
            const maxFree = freeCredits.length ? Math.max(...freeCredits) : 0;
            const freeText =
                minFree === maxFree
                    ? `${minFree} FREE`
                    : `${minFree}-${maxFree} FREE`;

            // Paid credits
            const paidCredits = slots
                .map((s) => s.paid_credits ?? 0)
                .filter((v) => v != null);
            const minPaid = paidCredits.length ? Math.min(...paidCredits) : 0;
            const maxPaid = paidCredits.length ? Math.max(...paidCredits) : 0;
            const paidText =
                minPaid === maxPaid
                    ? `${minPaid} PAID`
                    : `${minPaid}-${maxPaid} PAID`;

            return (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                        {priceText}
                    </span>
                    <div className="flex gap-2 text-xs">
                        <span className="text-green-600 font-medium">
                            {freeText}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-blue-600 font-medium">
                            {paidText}
                        </span>
                    </div>
                </div>
            );
        }

        return <span className="font-medium truncate">{priceText}</span>;
    };

    const getFrequencyLabel = (event?: EventType) => {
        if (!event?.is_recurring) return "One-Time Event";

        const freqType = event.frequency?.type;
        if (!freqType) return "Session";

        const labels: Record<string, string> = {
            daily: "Daily",
            weekly: "Weekly",
            biweekly: "Bi-weekly",
            monthly: "Monthly",
            annually: "Annually",
            custom: "Custom Dates",
        };

        return labels[freqType] ?? freqType;
    };

    const handleDeactivate = (id: string) => {
        if (
            !confirm(
                "Are you sure you want to deactivate this event? This action cannot be undone."
            )
        )
            return;

        router.post(
            `/merchant/events/${id}/deactivate`,
            {},
            {
                onSuccess: () => {
                    alert("Event deactivated successfully!");
                },
                onError: (errors) => {
                    console.error(errors);
                    alert("Failed to deactivate event.");
                },
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 px-8 py-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">
                                        {userRole === "admin"
                                            ? "All Events"
                                            : "My Events"}
                                    </h1>
                                    <p className="text-orange-50 text-lg">
                                        {userRole === "admin"
                                            ? "Manage and review all events on the platform"
                                            : "Manage your events and programs"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* View Toggle */}
                                    <div className="flex bg-white rounded-xl p-1 shadow-lg">
                                        <button
                                            onClick={() => setViewMode("table")}
                                            className={`px-4 py-2 rounded-lg transition-all ${
                                                viewMode === "table"
                                                    ? "bg-orange-500 text-white"
                                                    : "text-gray-600 hover:bg-orange-50"
                                            }`}
                                        >
                                            <List size={20} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={`px-4 py-2 rounded-lg transition-all ${
                                                viewMode === "grid"
                                                    ? "bg-orange-500 text-white"
                                                    : "text-gray-600 hover:bg-orange-50"
                                            }`}
                                        >
                                            <Grid3x3 size={20} />
                                        </button>
                                    </div>

                                    {userRole === "merchant" && (
                                        <button
                                            onClick={() =>
                                                router.visit(
                                                    "/merchant/events/create"
                                                )
                                            }
                                            className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <Plus size={20} />
                                            Create Event
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 w-full">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div
                                className={`${
                                    userRole === "admin"
                                        ? "md:w-1/2 flex gap-4"
                                        : "md:w-1/2"
                                }`}
                            >
                                <div className="relative flex-1">
                                    <Search
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={20}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                {userRole === "admin" && (
                                    <div className="relative flex-1">
                                        <Search
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={20}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search merchant ID or company name..."
                                            value={merchantQuery}
                                            onChange={(e) =>
                                                setMerchantQuery(e.target.value)
                                            }
                                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                            </div>
                            <div
                                className={`${
                                    userRole === "admin"
                                        ? "md:w-1/2 flex gap-4"
                                        : "md:w-1/2 flex gap-4"
                                }`}
                            >
                                <div className="relative flex-1">
                                    <Filter
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={20}
                                    />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) =>
                                            setStatusFilter(e.target.value)
                                        }
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                        <option value="rejected">
                                            Rejected
                                        </option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>

                                <div className="flex-1">
                                    <select
                                        value={typeFilter}
                                        onChange={(e) =>
                                            setTypeFilter(e.target.value)
                                        }
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="event">Events</option>
                                        <option value="trial_class">
                                            Trial Classes
                                        </option>
                                        <option value="location_based">
                                            Field Trips
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-8 w-full">
                        <button
                            onClick={() => setTab("upcoming")}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                tab === "upcoming"
                                    ? "bg-orange-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            Upcoming ({upcomingEvents.length})
                        </button>
                        <button
                            onClick={() => setTab("past")}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                tab === "past"
                                    ? "bg-orange-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            Past ({pastEvents.length})
                        </button>
                    </div>

                    {/* Events Display */}
                    {filteredEvents.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <Calendar className="mx-auto h-20 w-20 text-gray-300 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                No events found
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery ||
                                statusFilter !== "all" ||
                                typeFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Create your first event to get started"}
                            </p>
                            {userRole === "merchant" && (
                                <button
                                    onClick={() =>
                                        router.visit("/merchant/events/create")
                                    }
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all"
                                >
                                    <Plus size={20} />
                                    Create Event
                                </button>
                            )}
                        </div>
                    ) : viewMode === "table" ? (
                        /* Table View */
                        <TableView
                            filteredEvents={filteredEvents}
                            statusColors={statusColors}
                            getEventTypeLabel={getEventTypeLabel}
                            getFrequencyLabel={getFrequencyLabel}
                            getPriceRange={getPriceRange}
                            userRole={userRole}
                            router={router}
                            handleDeactivate={handleDeactivate}
                            tab={tab}
                        />
                    ) : (
                        /* Grid View */
                        <GridView
                            userRole={userRole}
                            router={router}
                            handleDeactivate={handleDeactivate}
                            filteredEvents={filteredEvents}
                            statusColors={statusColors}
                            getEventTypeLabel={getEventTypeLabel}
                            getPriceRange={getPriceRange}
                            getFrequencyLabel={getFrequencyLabel}
                            tab={tab}
                        />
                    )}

                    {/* Pagination */}
                    {events.links.length > 3 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            {events.links.map((link, index) =>
                                link.url ? (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            router.get(link.url!, {
                                                preserveState: true,
                                                data: { viewMode },
                                            })
                                        }
                                        disabled={link.active}
                                        className={`px-4 py-2 border-2 rounded-lg transition-all font-medium ${
                                            link.active
                                                ? "bg-orange-500 text-white border-orange-500"
                                                : "bg-white border-gray-200 hover:border-orange-500 hover:text-orange-600"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label.replace(
                                                /&laquo;|&raquo;/g,
                                                (match) =>
                                                    match === "&laquo;"
                                                        ? "←"
                                                        : "→"
                                            ),
                                        }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        className="px-4 py-2 text-gray-400 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label.replace(
                                                /&laquo;|&raquo;/g,
                                                (match) =>
                                                    match === "&laquo;"
                                                        ? "←"
                                                        : "→"
                                            ),
                                        }}
                                    />
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
