export type UserRole = "merchant" | "admin";

export interface AgeGroup {
    id?: string;
    event_id?: string;
    label: string;
    min_age: number | null;
    max_age: number | null;
    fixed_price_in_rm?: number | null;
    weekday_price_in_rm?: number | null;
    weekend_price_in_rm?: number | null;
}

export interface Price {
    id?: string;
    event_id?: string;
    event_age_group_id?: string | null;
    pricing_type: "fixed" | "age_based" | "day_type" | "mixed";
    fixed_price_in_rm?: number | null;
    weekday_price_in_rm?: number | null;
    weekend_price_in_rm?: number | null;
}

export interface Frequency {
    id?: string;
    event_id?: string;
    type: "daily" | "weekly" | "biweekly" | "monthly" | "annually" | "custom";
    days_of_week?: number[] | null;
    selected_dates?: string[] | null;
}

export interface EventSlot {
    id?: string;
    event_id?: string;
    event_date_id?: string;
    date?: string;
    start_time: string;
    end_time: string;
    duration?: number | null;
    capacity: number | null;
    is_unlimited: boolean;
    prices?: EventSlotPrice[];
}

export interface EventSlotPrice {
    id: string;
    event_slot_id: string;
    event_age_group_id: string | null;
    price_in_rm: number | null;
    free_credits: number | null;
    paid_credits: number | null;
}

export interface EventDate {
    id?: string;
    event_id?: string;
    event_frequency_id?: string | null;
    start_date: string;
    end_date: string;
    slots: EventSlot[];
}

export interface EventLocation {
    place_id?: string;
    location_name: string;
    latitude?: number | null;
    longitude?: number | null;
    viewport?: any | null;
    raw_place?: any | null;
    how_to_get_there?: string;
}

export interface EventMedia {
    id?: string;
    event_id?: string;
    file_path?: string;
    file_type?: string;
    file_size?: number;
    url?: string;
}

export interface EventFormShape {
    id?: string;
    merchant_id: string | null;

    type: "event" | "trial_class" | "location_based";
    title: string;
    description?: string;
    category?: string;

    location: EventLocation;

    media?: (File | EventMedia)[];
    removed_media?: string[];

    is_suitable_for_all_ages: boolean;
    age_groups: AgeGroup[];

    pricing_type?: PricingType;
    prices: Price[];

    is_recurring: boolean;
    frequencies: Frequency[];
    event_dates: EventDate[];

    status?: EventStatus;
    featured?: boolean;
}

export interface EventSubmissionData
    extends Omit<EventFormShape, "media" | "removed_media"> {
    media?: File[];
    removed_media?: string[];
}

export interface Event {
    id: string;
    merchant_id: string;
    type: "event" | "trial_class" | "location_based";
    title: string;
    description: string | null;
    category: string | null;
    is_suitable_for_all_ages: boolean;
    is_recurring: boolean;
    featured: boolean;
    like_count: number;
    click_count: number;
    status: "draft" | "pending" | "active" | "inactive" | "rejected";
    rejected_reason: string | null;
    age_groups: AgeGroup[];
    event_dates?: EventDate[];
    slotPrices?: EventSlotPrice[];
    slots?: EventSlot[];
    created_at: string;
    updated_at: string;
}

export interface Conversion {
    id: string;
    credits_per_rm: number;
    free_credit_percentage: number;
    paid_credit_percentage: number;
    effective_from: string;
    valid_until: string | null;
    status: "active" | "inactive";
}

export interface Booking {
    id: string;
    customer_id: string;
    event_id: string;
    slot_id: string;
    quantity: number;
    status: "pending" | "confirmed" | "cancelled" | "refunded";
}
