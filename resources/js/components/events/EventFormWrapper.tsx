import { useState } from "react";
import EventTabsNav from "./EventTabsNav";
import BasicDetailsTab from "./create/BasicDetailsTab";
import PricingTab from "./create/PricingTab";
import FrequencyTab from "./create/FrequencyTab";
import FormNavigation from "./FormNavigation";
import useEventForm from "../../hooks/useEventForm";
import type { EventFormShape } from "../../types/events";

type TabId = "basic" | "pricing" | "frequency";

interface EventFormWrapperProps {
    initialProps?: {
        userRole?: string;
        merchant_id?: string | null;
        initialData?: EventFormShape;
    };
}

export default function EventFormWrapper({
    initialProps,
}: EventFormWrapperProps) {
    const form = useEventForm(initialProps);
    const [activeTab, setActiveTab] = useState<TabId>("basic");

    // Determine if we're editing based on whether initialData has an ID
    const isEditing = !!initialProps?.initialData?.id;

    const tabs: { id: TabId; label: string }[] = [
        { id: "basic", label: "Basic Info" },
        { id: "pricing", label: "Pricing" },
        { id: "frequency", label: "Recurrence" },
    ];

    const handleSetActiveTab = (id: string) => {
        if (["basic", "pricing", "frequency"].includes(id)) {
            setActiveTab(id as TabId);
        }
    };

    return (
        <form onSubmit={form.handleSubmit} className="space-y-6">
            {/* Tabs Navigation */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                <EventTabsNav
                    tabs={tabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            </div>

            {/* Tab Content */}
            {activeTab === "basic" && (
                <BasicDetailsTab
                    data={form.data}
                    setData={form.setData}
                    errors={form.errors}
                    handleMediaInput={form.handleMediaInput}
                    mediaPreviews={form.mediaPreviews}
                    removeMedia={form.removeMedia}
                    ageGroups={form.ageGroups}
                    addAgeGroup={form.addAgeGroup}
                    updateAgeGroup={form.updateAgeGroup}
                />
            )}

            {activeTab === "pricing" && (
                <PricingTab
                    data={form.data}
                    setData={form.setData}
                    errors={form.errors}
                    ageGroups={form.ageGroups}
                    addAgeGroup={form.addAgeGroup}
                    updateAgeGroup={form.updateAgeGroup}
                    removeAgeGroup={form.removeAgeGroup}
                />
            )}

            {activeTab === "frequency" && (
                <FrequencyTab
                    data={form.data}
                    setData={form.setData}
                    errors={form.errors}
                    frequencies={form.frequencies}
                    addFrequency={form.addFrequency}
                    removeFrequency={form.removeFrequency}
                    updateFrequency={form.updateFrequency}
                    eventDates={form.eventDates}
                    updateEventDate={form.updateEventDate}
                    addSlot={form.addSlot}
                    removeSlot={form.removeSlot}
                    updateSlot={form.updateSlot}
                    getSlots={form.getSlots}
                />
            )}
            
            {/* Form Navigation */}
            <FormNavigation
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={handleSetActiveTab}
                processing={form.processing}
                onSubmit={form.handleSubmit}
                isEditing={isEditing}
            />
        </form>
    );
}
