import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import type {
    AgeGroup,
    Price,
    Frequency,
    EventFormShape,
} from "../types/events";

/* -------------------- HOOK -------------------- */
export default function useEventForm(initialProps?: {
    userRole?: string;
    merchant_id?: string | null;
    initialData?: EventFormShape;
}) {
    /* -------------------- DEFAULTS -------------------- */
    const defaultInitial: EventFormShape = {
        merchant_id: initialProps?.merchant_id ?? null,
        type: "event",
        title: "",
        description: "",
        category: "",
        default_capacity: null,
        featured: false,
        status: "draft",
        location: {
            place_id: "",
            location_name: "",
            latitude: null,
            longitude: null,
            viewport: null,
            raw_place: null,
            how_to_get_there: "",
        },
        age_groups: [],
        frequencies: [],
        slots: [],
        media: [],
        removed_media: [],
        is_recurring: false,
        pricing_type: "fixed",
        is_unlimited_capacity: false,
        is_suitable_for_all_ages: false,
        is_all_day: false,
    };

    /* -------------------- DEEP MERGE INITIAL DATA -------------------- */
    const initial: EventFormShape = {
        ...defaultInitial,
        ...initialProps?.initialData,
        location: {
            ...defaultInitial.location,
            ...(initialProps?.initialData?.location || {}),
        },
        age_groups: initialProps?.initialData?.age_groups
            ? initialProps.initialData.age_groups.map((g) => ({
                  ...g,
                  fixed_price_in_cents: g.fixed_price_in_cents ?? null,
                  weekday_price_in_cents: g.weekday_price_in_cents ?? null,
                  weekend_price_in_cents: g.weekend_price_in_cents ?? null,
              }))
            : [],
        frequencies: initialProps?.initialData?.frequencies
            ? [...initialProps.initialData.frequencies]
            : [],
        media: initialProps?.initialData?.media
            ? [...initialProps.initialData.media]
            : [],
    };

    /* -------------------- FORM STATE -------------------- */
    const form = useForm<EventFormShape>(initial);
    const { data, setData, processing, errors, reset } = form;

    const [mediaPreviews, setMediaPreviews] = useState<string[]>(
        data.media?.map((file: any) => file.url || "") || []
    );
    const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(
        data.age_groups || []
    );
    const [frequencies, setFrequencies] = useState<Frequency[]>(
        data.frequencies || []
    );

    /* -------------------- MEDIA HANDLING -------------------- */
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

    /* -------------------- AGE GROUPS -------------------- */
    const addAgeGroup = () => {
        setAgeGroups((prev) => [
            ...prev,
            {
                label: "",
                min_age: null,
                max_age: null,
                fixed_price_in_cents: null,
                weekday_price_in_cents: null,
                weekend_price_in_cents: null,
            },
        ]);
    };

    const updateAgeGroup = (
        index: number,
        field: keyof AgeGroup,
        value: any
    ) => {
        setAgeGroups((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const removeAgeGroup = (index: number) => {
        setAgeGroups((prev) => prev.filter((_, i) => i !== index));
    };

    /* -------------------- FREQUENCIES -------------------- */
    const addFrequency = () => {
        const newFreq: Frequency = {
            type: "weekly",
            start_date: "",
            end_date: "",
            start_time: "",
            end_time: "",
            capacity: null,
            selected_dates: [],
            days_of_week: [],
            is_unlimited_capacity: false,
            is_all_day: false,
        };
        setFrequencies((prev) => [...prev, newFreq]);
    };

    const updateFrequency = (index: number, field: string, value: any) => {
        setFrequencies((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const removeFrequency = (index: number) => {
        setFrequencies((prev) => prev.filter((_, i) => i !== index));
    };

    /* -------------------- SYNC STATE -------------------- */
    useEffect(() => {
        setData("age_groups", ageGroups);
    }, [ageGroups]);

    useEffect(() => {
        setData("frequencies", frequencies);
    }, [frequencies]);

    useEffect(() => {
        if (data.media?.length) {
            setMediaPreviews(data.media.map((file: any) => file.url || ""));
        }
    }, [data.media]);

    /* -------------------- SUBMIT -------------------- */
    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        // -------------------- 1️⃣ Build Frequencies --------------------
        const finalFrequencies: Frequency[] = (
            frequencies.length
                ? frequencies
                : [
                      {
                          type: "one_time" as const,
                          start_date: data.start_date || "",
                          end_date: data.end_date || data.start_date || "",
                          start_time: data.start_time || "",
                          end_time: data.end_time || "",
                          capacity: data.default_capacity ?? null,
                          is_unlimited_capacity:
                              data.is_unlimited_capacity ?? false,
                          is_all_day: data.is_all_day ?? false,
                          selected_dates: data.start_date
                              ? [data.start_date]
                              : [],
                          days_of_week: [],
                          slots: [],
                      },
                  ]
        ).map((freq) => ({
            ...freq,
            type: freq.type as Frequency["type"],
            capacity: freq.capacity ?? data.default_capacity ?? null,
            is_unlimited_capacity:
                freq.is_unlimited_capacity ??
                data.is_unlimited_capacity ??
                false,
            is_all_day: freq.is_all_day ?? data.is_all_day ?? false,
            slots: [],
            selected_dates: freq.selected_dates ?? [],
            days_of_week: freq.days_of_week ?? [],
        }));

        // -------------------- 2️⃣ Build Age Groups --------------------
        const finalAgeGroups: AgeGroup[] = data.is_suitable_for_all_ages
            ? []
            : ageGroups.length
            ? ageGroups.map((g) => ({
                  id: g.id,
                  label: g.label,
                  min_age: g.min_age ?? null,
                  max_age: g.max_age ?? null,
                  fixed_price_in_cents: g.fixed_price_in_cents ?? null,
                  weekday_price_in_cents: g.weekday_price_in_cents ?? null,
                  weekend_price_in_cents: g.weekend_price_in_cents ?? null,
              }))
            : [{ label: "No age group selected" }];

        // -------------------- 3️⃣ Build Prices --------------------
        const finalPrices: Price[] = (() => {
            switch (data.pricing_type) {
                case "fixed":
                    return [
                        {
                            pricing_type: "fixed",
                            fixed_price_in_cents:
                                finalAgeGroups[0]?.fixed_price_in_cents ?? 0,
                        },
                    ];
                case "day_type":
                    return [
                        {
                            pricing_type: "day_type",
                            weekday_price_in_cents:
                                finalAgeGroups[0]?.weekday_price_in_cents ?? 0,
                            weekend_price_in_cents:
                                finalAgeGroups[0]?.weekend_price_in_cents ?? 0,
                        },
                    ];
                case "age_based":
                    return finalAgeGroups.map((g) => ({
                        age_group_id: g.id,
                        age_group_label: g.label,
                        pricing_type: "age_based",
                        fixed_price_in_cents: g.fixed_price_in_cents ?? 0,
                    }));
                case "mixed":
                    return finalAgeGroups.map((g) => ({
                        age_group_id: g.id,
                        age_group_label: g.label,
                        pricing_type: "mixed",
                        weekday_price_in_cents: g.weekday_price_in_cents ?? 0,
                        weekend_price_in_cents: g.weekend_price_in_cents ?? 0,
                    }));
                default:
                    return [];
            }
        })();

        // -------------------- 4️⃣ Construct Submission Payload --------------------
        const submissionPayload: Omit<
            EventFormShape,
            | "pricing_type"
            | "fixed_price_in_cents"
            | "weekday_price_in_cents"
            | "weekend_price_in_cents"
        > & { prices: Price[] } = {
            ...data,
            age_groups: finalAgeGroups,
            frequencies: finalFrequencies,
            prices: finalPrices,
            slots: [], // backend generates slots
        };

        console.log("🚀 Submission Payload:", submissionPayload);

        if (data.id) {
            form.put(route("merchant.events.update", data.id), {
                preserveScroll: true,
            });
        } else {
            form.post(route("merchant.events.store"), {
                preserveScroll: true,
            });
        }
    };

    return {
        data,
        setData,
        errors,
        processing,
        reset,
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
        handleSubmit,
    };
}
