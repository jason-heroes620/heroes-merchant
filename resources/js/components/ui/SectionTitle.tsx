import React from "react";

export default function SectionTitle({
    title,
    icon,
}: {
    title: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-2 mb-6">
            {icon}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
    );
}
