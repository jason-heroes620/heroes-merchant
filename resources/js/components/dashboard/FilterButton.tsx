import React from "react";

interface FilterButtonProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
    active,
    onClick,
    children,
    className = "",
}) => {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center px-3 py-2 rounded-lg font-semibold text-sm transition-all
                ${
                    active
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }
                ${className}
            `}
        >
            {children}
        </button>
    );
};

export default FilterButton;
