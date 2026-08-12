

export function CategoriesGrid() {
    const categories = [
        {
            id: 1,
            title: "For Administrators",
            subtitle: "Total Control. Complete Visibility.",
            image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800",
            colSpan: "col-span-12 md:col-span-8",
            rowSpan: "row-span-2"
        },
        {
            id: 2,
            title: "For Teachers",
            subtitle: "Teach More, Manage Less.",
            image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&q=80&w=600",
            colSpan: "col-span-12 md:col-span-4",
            rowSpan: "row-span-1"
        },
        {
            id: 3,
            title: "For Students & Parents",
            subtitle: "Always Connected. Always Informed.",
            image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600",
            colSpan: "col-span-12 md:col-span-4",
            rowSpan: "row-span-1"
        }
    ];

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-heading text-brand-dark mb-8">Designed for Everyone</h2>

                <div className="grid grid-cols-12 gap-4 md:gap-6 auto-rows-[300px]">
                    {categories.map((category) => (
                        <a
                            href="#"
                            key={category.id}
                            className={`${category.colSpan} ${category.rowSpan} group relative block overflow-hidden rounded-sm`}
                        >
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url("${category.image}")` }}
                            ></div>

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-500"></div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col justify-end h-full">
                                <div className="bg-white/95 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl max-w-sm">
                                    <h3 className="font-heading text-2xl text-brand-teal mb-1">{category.title}</h3>
                                    <p className="text-brand-dark opacity-80 mb-4">{category.subtitle}</p>
                                    <span className="inline-block text-brand-teal font-bold uppercase text-sm border-b-2 border-brand-green pb-0.5 mt-auto">
                                        Discover Tools
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

            </div>
        </section>
    );
}
