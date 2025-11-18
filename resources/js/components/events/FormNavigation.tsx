import { ChevronLeft, ChevronRight, CheckCircle, Edit } from "lucide-react";

interface FormNavigationProps {
    tabs: { id: string; label: string }[];
    activeTab: string;
    setActiveTab: (id: string) => void;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    isEditing?: boolean;
}

export default function FormNavigation({
    tabs,
    activeTab,
    setActiveTab,
    processing,
    onSubmit,
    isEditing = false,
}: FormNavigationProps) {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const isFirstTab = currentIndex === 0;
    const isLastTab = currentIndex === tabs.length - 1;

    const handlePrevious = () => {
        if (!isFirstTab) {
            setActiveTab(tabs[currentIndex - 1].id);
        }
    };

    const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); 
        if (!isLastTab) setActiveTab(tabs[currentIndex + 1].id);
    };

    return (
        <div className="sticky bottom-0 z-10 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Progress Indicator */}
                <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                                width: `${
                                    ((currentIndex + 1) / tabs.length) * 100
                                }%`,
                            }}
                        ></div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={isFirstTab}
                        className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all transform ${
                            isFirstTab
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:shadow-lg hover:scale-105 active:scale-95"
                        }`}
                    >
                        <ChevronLeft size={20} />
                        Previous
                    </button>

                    {!isLastTab ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                        >
                            Next
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            onClick={onSubmit}
                            disabled={processing}
                            className={`flex items-center gap-3 px-10 py-4 rounded-xl font-bold transition-all shadow-xl transform ${
                                processing
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : isEditing
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95"
                                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 active:scale-95"
                            } text-white`}
                        >
                            {processing ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    {isEditing ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                <>
                                    {isEditing ? (
                                        <>
                                            <Edit size={20} />
                                            Update Event
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            Create Event
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
