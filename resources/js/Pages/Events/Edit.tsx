import EventFormWrapper from "../../components/events/EventFormWrapper";
import { usePage } from "@inertiajs/react";

export default function EditEventPage() {
    const page = usePage<any>();
    const props = page.props || {};

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 px-8 py-8">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Edit Event
                        </h1>
                    </div>
                </div>
                <EventFormWrapper
                    initialProps={{
                        userRole: props.userRole,
                        merchant_id: props.merchant_id,
                        initialData: props.event,
                    }}
                />
            </div>
        </div>
    );
}
