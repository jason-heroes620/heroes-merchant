export default function CategorySection({ data, setData }: any) {
    const categories = [
        "Sports & Fitness",
        "Arts & Crafts",
        "Music & Dance",
        "Academic",
        "Technology",
        "Outdoor Adventure",
        "Language Learning",
        "STEM",
        "Life Skills",
        "Swimming",
        "Martial Arts",
        "Drama & Theater",
        "Cooking & Baking",
        "Science",
        "Mathematics",
        "Other",
    ];

    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                Category <span className="text-red-500">*</span>
            </label>
            <select
                value={data.category ?? ""}
                onChange={(e) => setData("category", e.target.value)}
                className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm transition-all"
            >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>
        </div>
    );
}
