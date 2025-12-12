import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import type {
    AgeGroup,
    Price,
    Frequency,
    EventDate,
    EventSlot,
    EventFormShape,
} from "../types/events";

interface UseEventFormProps {
    userRole?: string;
    merchant_id?: string | null;
    initialData?: Partial<EventFormShape>;
}

export default function useEventForm(initialProps?: UseEventFormProps) {
    const defaultData: EventFormShape = {
        merchant_id: initialProps?.merchant_id ?? null,
        type: "event",
        title: "",
        description: "",
        category: "",
        location: {
            place_id: "",
            location_name: "",
            latitude: null,
            longitude: null,
            viewport: null,
            raw_place: null,
            how_to_get_there: "",
        },
        media: [],
        removed_media: [],
        is_suitable_for_all_ages: false,
        age_groups: [],
        pricing_type: "fixed",
        prices: [],
        is_recurring: false,
        frequencies: [],
        event_dates: [],
        status: "pending",
        featured: false,
    };

    // Merge with initial data if editing
    const initialFormData: EventFormShape = {
        ...defaultData,
        ...initialProps?.initialData,
        location: {
            ...defaultData.location,
            ...(initialProps?.initialData?.location || {}),
        },
        age_groups: initialProps?.initialData?.age_groups
            ? [...initialProps.initialData.age_groups]
            : [],
        frequencies: initialProps?.initialData?.frequencies
            ? [...initialProps.initialData.frequencies]
            : [],
        event_dates: initialProps?.initialData?.event_dates
            ? initialProps.initialData.event_dates.map((ed) => ({
                  ...ed,
                  slots: ed.slots || [],
              }))
            : [],
        media: initialProps?.initialData?.media
            ? [...initialProps.initialData.media]
            : [],
    };

    // Inertia form
    const form = useForm<EventFormShape>(initialFormData);
    const { data, setData, errors, processing } = form;

    // Local state for complex fields
    const [mediaPreviews, setMediaPreviews] = useState<string[]>(
        data.media?.map((file: any) => file.url || "") || []
    );
    const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(
        initialFormData.age_groups || []
    );
    const [frequencies, setFrequencies] = useState<Frequency[]>(
        initialFormData.frequencies || []
    );
    const [eventDates, setEventDates] = useState<EventDate[]>(
        initialFormData.event_dates || []
    );

    // ==================== MEDIA HANDLERS ====================
    const handleMediaInput = (files?: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).slice(
            0,
            10 - (data.media?.length || 0)
        );
        setData("media", [...(data.media || []), ...newFiles]);

        newFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () =>
                setMediaPreviews((prev) => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (index: number) => {
        const removed = data.media?.[index];
        if ((removed as any)?.id) {
            setData("removed_media", [
                ...(data.removed_media || []),
                (removed as any).id,
            ]);
        }
        setData(
            "media",
            (data.media || []).filter((_, i) => i !== index)
        );
        setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // ==================== AGE GROUP HANDLERS ====================
    const addAgeGroup = () => {
        setAgeGroups([
            ...ageGroups,
            { label: "", min_age: null, max_age: null },
        ]);
    };

    const updateAgeGroup = (
        index: number,
        field: keyof AgeGroup,
        value: any
    ) => {
        const updated = [...ageGroups];
        updated[index] = { ...updated[index], [field]: value };
        setAgeGroups(updated);
    };

    const removeAgeGroup = (index: number) => {
        setAgeGroups(ageGroups.filter((_, i) => i !== index));
    };

    // ==================== FREQUENCY HANDLERS ====================
    const addFrequency = () => {
        const newFreq: Frequency = {
            type: "weekly",
            days_of_week: [],
            selected_dates: [],
        };
        setFrequencies([...frequencies, newFreq]);

        // Add corresponding event date with empty slots array
        const newDate: EventDate = {
            start_date: "",
            end_date: "",
            slots: [], // Initialize with empty slots
        };
        setEventDates([...eventDates, newDate]);
    };

    const updateFrequency = (index: number, field: string, value: any) => {
        const updated = [...frequencies];
        updated[index] = { ...updated[index], [field]: value };
        setFrequencies(updated);
    };

    const removeFrequency = (index: number) => {
        setFrequencies(frequencies.filter((_, i) => i !== index));
        setEventDates(eventDates.filter((_, i) => i !== index));
    };

    // ==================== EVENT DATE HANDLERS ====================
    const updateEventDate = (index: number, field: string, value: any) => {
        const updated = [...eventDates];

        // Ensure slots array exists
        if (!updated[index]) {
            updated[index] = {
                start_date: "",
                end_date: "",
                slots: [],
            };
        }

        updated[index] = {
            ...updated[index],
            [field]: value,
            // Preserve slots if they exist
            slots: updated[index].slots || [],
        };
        setEventDates(updated);
    };

    // ==================== SLOT HANDLERS ====================
    const addSlot = (dateIndex: number) => {
        const updated = [...eventDates];

        if (!updated[dateIndex]) {
            updated[dateIndex] = {
                start_date: "",
                end_date: "",
                slots: [],
            };
        }

        const newSlot: EventSlot = {
            date: eventDates[dateIndex]?.start_date || "",
            start_time: "",
            end_time: "",
            capacity: null,
            is_unlimited: false,
        };

        updated[dateIndex] = {
            ...updated[dateIndex],
            slots: [...(updated[dateIndex].slots || []), newSlot],
        };

        setEventDates(updated);
    };

    const removeSlot = (dateIndex: number, slotIndex: number) => {
        const updated = [...eventDates];

        if (updated[dateIndex]) {
            updated[dateIndex] = {
                ...updated[dateIndex],
                slots: (updated[dateIndex].slots || []).filter(
                    (_, i) => i !== slotIndex
                ),
            };
        }

        setEventDates(updated);
    };

    const updateSlot = (
        dateIndex: number,
        slotIndex: number,
        field: keyof EventSlot,
        value: any
    ) => {
        const updated = [...eventDates];

        if (updated[dateIndex] && updated[dateIndex].slots) {
            const updatedSlots = [...updated[dateIndex].slots];
            updatedSlots[slotIndex] = {
                ...updatedSlots[slotIndex],
                [field]: value,
            };

            updated[dateIndex] = {
                ...updated[dateIndex],
                slots: updatedSlots,
            };
        }

        setEventDates(updated);
    };

    const getSlots = (dateIndex: number): EventSlot[] => {
        return eventDates[dateIndex]?.slots || [];
    };

    // ==================== PRICE BUILDERS ====================
    const buildPrices = (): Price[] => {
        const pricingType = data.pricing_type || "fixed";

        // For age_based or mixed, create one price per age group
        if (
            (pricingType === "age_based" || pricingType === "mixed") &&
            !data.is_suitable_for_all_ages &&
            ageGroups.length > 0
        ) {
            return ageGroups.map((ag) => ({
                event_age_group_id: ag.id || null,
                pricing_type: pricingType,
                fixed_price_in_rm:
                    pricingType === "age_based"
                        ? ag.fixed_price_in_rm || null
                        : null,
                weekday_price_in_rm:
                    pricingType === "mixed"
                        ? ag.weekday_price_in_rm || null
                        : null,
                weekend_price_in_rm:
                    pricingType === "mixed"
                        ? ag.weekend_price_in_rm || null
                        : null,
            }));
        }

        // For fixed or day_type, single price entry
        const existingPrice = data.prices?.[0] || {};
        return [
            {
                pricing_type: pricingType,
                event_age_group_id: null,
                fixed_price_in_rm:
                    pricingType === "fixed"
                        ? existingPrice.fixed_price_in_rm || null
                        : null,
                weekday_price_in_rm:
                    pricingType === "day_type"
                        ? existingPrice.weekday_price_in_rm || null
                        : null,
                weekend_price_in_rm:
                    pricingType === "day_type"
                        ? existingPrice.weekend_price_in_rm || null
                        : null,
            },
        ];
    };

    // ==================== SYNC TO FORM DATA ====================
    useEffect(() => {
        setData("age_groups", data.is_suitable_for_all_ages ? [] : ageGroups);
    }, [ageGroups, data.is_suitable_for_all_ages]);

    useEffect(() => {
        setData("frequencies", frequencies);
    }, [frequencies]);

    useEffect(() => {
        setData("event_dates", eventDates);
    }, [eventDates]);

    // ==================== FORM SUBMISSION ====================
    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        // Determine is_recurring
        const isRecurring = frequencies.length > 0;

        // Build final prices
        const finalPrices = buildPrices();

        // Prepare submission data
        const submissionData: EventFormShape = {
            ...data,
            is_recurring: isRecurring,
            age_groups: data.is_suitable_for_all_ages ? [] : ageGroups,
            prices: finalPrices,
            frequencies: isRecurring ? frequencies : [],
            event_dates: eventDates,
        };

        const formData = new FormData();

        Object.entries(submissionData).forEach(([key, value]) => {
            if (key === "media") {
                (value as any[])?.forEach((file) => {
                    if (file instanceof File) {
                        formData.append("media[]", file);
                    }
                });
            } else if (key === "removed_media") {
                (value as string[])?.forEach((id) => {
                    formData.append("removed_media[]", id);
                });
            } else if (
                [
                    "age_groups",
                    "prices",
                    "frequencies",
                    "event_dates",
                    "location",
                ].includes(key)
            ) {
                formData.append(key, JSON.stringify(value));
            } else if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        console.log("🚀 Submission Payload:", submissionData);

        const requestOptions = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success(
                    data.id
                        ? "Event updated successfully!"
                        : "Event created successfully!"
                );
            },
            onError: (errors: any) => {
                Object.values(errors).forEach((err) => {
                    if (Array.isArray(err)) {
                        err.forEach((msg) => toast.error(msg));
                    } else {
                        toast.error(String(err));
                    }
                });
            },
        };

        // Submit
        if (data.id) {
            form.put(route("merchant.events.update", data.id), requestOptions);
        } else {
            form.post(route("merchant.events.store"), requestOptions);
        }
    };

    return {
        form,
        data,
        setData,
        errors,
        processing,
        mediaPreviews,
        handleMediaInput,
        removeMedia,
        ageGroups,
        addAgeGroup,
        updateAgeGroup,
        removeAgeGroup,
        frequencies,
        addFrequency,
        updateFrequency,
        removeFrequency,
        eventDates,
        updateEventDate,
        addSlot,
        removeSlot,
        updateSlot,
        getSlots,
        handleSubmit,
    };
}
