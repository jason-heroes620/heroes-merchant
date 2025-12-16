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
    date: string;
    start_time: string;
    end_time: string;
    duration?: number | null;
    capacity: number | null;
    is_unlimited: boolean;
    booked_quantity?: number | null;
    available_seats?: number | null;
    prices?: EventSlotPrice[];
    display_start?: string;
    display_end?: string;
    is_completed?: boolean;
    bookings?: Booking[];
    expected_attendees?: number;
    actual_attendees?: number;
    absent_count?: number;
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

export interface Merchant {
    id: string;
    company_name: string;
}

export interface SyntheticSlot {
    date: string;
    start_time?: string | null;
    end_time?: string | null;
}

type SlotWithDisplay = {
  display_start: string; 
  display_end: string;
  raw: {
    is_unlimited?: boolean;
    capacity?: number;
    booked_quantity?: number;
  };
};

export interface EventType {
    id: string;
    merchant_id?: string;
    merchant?: Merchant;
    slot?: EventSlot | SyntheticSlot | null;
    title: string;
    type: string;
    category?: string;
    status: string;
    featured: boolean;
    location?: EventLocation;
    media?: EventMedia[];
    is_suitable_for_all_ages: boolean;
    is_recurring: boolean;
    age_groups?: AgeGroup[];
    prices?: Price[];
    slots?: EventSlot[];
    created_at: string;
    like_count?: number;
    click_count?: number;
    slotPrices?: EventSlotPrice[];
    dates?: EventDate[];
    frequency?: Frequency[];
    is_upcoming: boolean;
    is_past: boolean;
    all_slots?: SlotWithDisplay[];
}


export interface Event {
    id: string;
    merchant_id: string;
    type: "event" | "trial_class" | "location_based";
    title: string;
    description: string | null;
    category: string | null;
    location?: string;
    media?: string | null;
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

export interface Customer {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    profile_picture?: string;
}

export interface BookingItem {
    age_group_id: string | null;
    age_group_label: string;
    quantity: number;
    paid_credits?: number;
    free_credits?: number;
    total_paid?: number;
    total_free?: number;
}

export interface Booking {
    id: string;
    booking_code: string;
    booking_id?: string;
    status: string;
    quantity: number;
    booked_at: string;
    cancelled_at?: string;
    slot?: EventSlot;
    event?: Event;
    items: BookingItem[];
    transactions?: Transaction[] | null;
    customer?: Customer | null;
    attendance?: BookingAttendance;
}

export interface Transaction {
    id: string;
    type: string;
    delta_free: number;
    delta_paid: number;
    created_at: string;
}

export type BookingAttendance = {
    summary: AttendanceSummary;
    list: Attendance[];
};

export type AttendanceSummary = {
    total: number;
    attended: number;
    pending: number;
    absent: number;
};

export type Attendance = {
    id: string;
    booking_id: string;
    slot_id: string;
    event_id: string;
    customer_id: string;
    status: "pending" | "attended" | "absent";
    scanned_at?: string | null;
    created_at: string;
    updated_at: string;
};

interface BookingType {
    id: number;
    booking_code: string;
    customer?: {
        user?: { full_name: string; email: string };
    };
    event?: { title: string };
    quantity?: number;
    total_amount?: number;
    attendance_status?: "pending" | "attended" | "absent";
    slot?: EventSlot;
    booked_at: string;
    created_at: string;
}
