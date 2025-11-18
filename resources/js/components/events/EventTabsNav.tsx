import React from "react";

type TabId = "basic" | "pricing" | "frequency";

export interface Tab {
    id: TabId;
    label: string;
}

interface EventTabsNavProps {
    tabs: Tab[];
    activeTab: TabId;
    setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
}

const EventTabsNav: React.FC<EventTabsNavProps> = ({
    tabs,
    activeTab,
    setActiveTab
}) => {
    return (
        <div className="border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
            <nav className="flex w-full">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 flex items-center justify-center gap-3 px-6 py-5 font-semibold transition-all ${
                                isActive
                                    ? "text-orange-600 bg-white"
                                    : "text-gray-600 hover:text-orange-600 hover:bg-white/50"
                            } 
                            }`}
                        >
                            <span className="text-center">{tab.label}</span>
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default EventTabsNav;
