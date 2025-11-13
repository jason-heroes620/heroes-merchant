import React, { useState, useEffect } from "react";
import { Inertia } from "@inertiajs/inertia";
import { usePage } from "@inertiajs/react";

interface Errors {
    conversion_rate?: string;
    effective_from?: string;
    valid_until?: string;
}

const ConversionsCreate: React.FC = () => {
    const { props } = usePage<any>();
    const errors = props.errors as Errors;

    const [form, setForm] = useState({
        credits: "",
        rm: "",
        conversion_rate: "",
        effective_from: "",
        valid_until: "",
    });

    // Auto-calculate conversion_rate whenever credits or RM changes
    useEffect(() => {
        const credits = parseFloat(form.credits);
        const rm = parseFloat(form.rm);

        if (!isNaN(credits) && !isNaN(rm) && rm > 0) {
            setForm((prev) => ({
                ...prev,
                conversion_rate: (credits / rm).toFixed(2),
            }));
        } else {
            setForm((prev) => ({ ...prev, conversion_rate: "" }));
        }
    }, [form.credits, form.rm]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        Inertia.post("/admin/conversions", form);
    };

    return (
        <div className="p-8 max-w-lg mx-auto bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Add Conversion Rate
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Credits input */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">
                        Credits
                    </label>
                    <input
                        type="number"
                        name="credits"
                        value={form.credits}
                        placeholder="1"
                        onChange={handleChange}
                        className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        step="1"
                        min="0"
                    />
                </div>

                {/* RM input */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">
                        RM
                    </label>
                    <input
                        type="number"
                        name="rm"
                        value={form.rm}
                        placeholder="1.80"
                        onChange={handleChange}
                        className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        step="0.01"
                        min="0"
                    />
                </div>

                {/* Auto-calculated conversion rate */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">
                        Conversion Rate (credits / RM)
                    </label>
                    <input
                        type="number"
                        name="conversion_rate"
                        value={form.conversion_rate}
                        readOnly
                        className="w-full border px-4 py-2 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                    {errors.conversion_rate && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.conversion_rate}
                        </p>
                    )}
                </div>

                {/* Effective From */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">
                        Effective From
                    </label>
                    <input
                        type="date"
                        name="effective_from"
                        value={form.effective_from}
                        onChange={handleChange}
                        className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {errors.effective_from && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.effective_from}
                        </p>
                    )}
                </div>

                {/* Valid Until */}
                <div>
                    <label className="block mb-1 font-medium text-gray-700">
                        Valid Until (optional)
                    </label>
                    <input
                        type="date"
                        name="valid_until"
                        value={form.valid_until}
                        onChange={handleChange}
                        className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {errors.valid_until && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.valid_until}
                        </p>
                    )}
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
                >
                    Save Conversion
                </button>
            </form>
        </div>
    );
};

export default ConversionsCreate;
