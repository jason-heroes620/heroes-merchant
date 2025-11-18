export type AgeGroup = {
    id?: string;
    label?: string;
    min_age?: number | null;
    max_age?: number | null;
    fixed_price_in_cents?: number | null;
    weekday_price_in_cents?: number | null;
    weekend_price_in_cents?: number | null;
    prices?: Price[];
};

export type Price = {
    id?: string;
    age_group_id?: string | null;
    age_group_label?: string;
    pricing_type: "fixed" | "age_based" | "day_type" | "mixed";
    fixed_price_in_cents?: number | null;
    weekday_price_in_cents?: number | null;
    weekend_price_in_cents?: number | null;
};

export type Frequency = {
    id?: string;
    type:
        | "one_time"
        | "daily"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "annually"
        | "custom";
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    capacity?: number | null;
    selected_dates?: string[];
    days_of_week?: number[];
    is_unlimited_capacity?: boolean;
    is_all_day?: boolean;
    slots?: Slot[];
};

export type Slot = {
    id?: string;
    frequency_id?: string | null;
    date: string;
    is_all_day: boolean;
    start_time: string;
    end_time: string;
    duration?: number;
    capacity?: number | null;
    is_unlimited?: boolean;
    booked?: number;
    slot_type?: string | null;
    price_in_cents?: number | null;
    price_in_credits?: number | null;
};

export type Location = {
    place_id?: string | null;
    location_name?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    viewport?: any | null;
    raw_place?: any | null;
    how_to_get_there?: string | null;
};

export type Media = {
    id: string;
    file_path: string;
    file_type: string;
};

export type EventFormShape = {
    id?: string;
    merchant_id?: string | null;
    type: string;
    title: string;
    description?: string;
    category?: string;
    default_capacity?: number | null;
    featured?: boolean;
    status?: "draft" | "pending" | "active" | "inactive" | "rejected";
    rejected_reason?: string | null;
    location?: Location;
    age_groups?: AgeGroup[];
    frequencies?: Frequency[];
    prices?: Price[];
    slots?: Slot[];
    media?: File[] | any[];
    removed_media?: string[];
    is_recurring?: boolean;
    pricing_type?: "fixed" | "age_based" | "day_type" | "mixed";
    fixed_price_in_cents?: number | null;
    weekday_price_in_cents?: number | null;
    weekend_price_in_cents?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    is_unlimited_capacity?: boolean;
    is_suitable_for_all_ages?: boolean;
    is_all_day?: boolean;
};

export interface Event {
    id: string;
    title: string;
    description?: string;
    type: string;
    category?: string;
    status: string;
    featured: boolean;
    rejected_reason?: string | null;
    location?: Location;
    default_capacity?: number | null;
    is_unlimited_capacity: boolean;
    is_suitable_for_all_ages: boolean;
    media?: Media[];
    ageGroups?: AgeGroup[];
    frequencies?: Frequency[];
    like_count?: number;
    click_count?: number;
}

export interface EventShowProps {
    event: Event;
    userRole: string;
}
