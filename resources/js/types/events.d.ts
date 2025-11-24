export type PricingType = "fixed" | "age_based" | "day_type" | "mixed";
export type FrequencyType =
    | "one_time"
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "annually"
    | "custom";
export type EventStatus =
    | "draft"
    | "pending"
    | "active"
    | "inactive"
    | "rejected";

export interface AgeGroup {
    id?: string;
    label: string;
    min_age: number | null;
    max_age: number | null;
    fixed_price_in_rm?: number | null;
    weekday_price_in_rm?: number | null;
    weekend_price_in_rm?: number | null;
}

export interface Price {
    id?: string;
    event_age_group_id?: string | null;
    pricing_type: PricingType;
    fixed_price_in_rm?: number | null;
    weekday_price_in_rm?: number | null;
    weekend_price_in_rm?: number | null;
}

export interface Frequency {
    id?: string;
    type: FrequencyType;
    days_of_week?: number[] | null;
    selected_dates?: string[] | null;
}

export interface EventSlot {
    start_time: string;
    end_time: string;
    capacity: number | null;
    is_unlimited: boolean;
}

export interface EventDate {
    id?: string;
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
