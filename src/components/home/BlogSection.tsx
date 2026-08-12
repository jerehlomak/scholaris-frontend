
export function BlogSection() {
    const articles = [
        {
            id: 1,
            tag: "Best Practices",
            title: "5 Ways to Improve Parent-Teacher Communication",
            image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600",
            description: "Learn how modern cloud platforms are bridging the gap between classrooms and homes."
        },
        {
            id: 2,
            tag: "Case Study",
            title: "How Riverside High Cut Admin Time by 40%",
            image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600",
            description: "A deep dive into automated grading, attendance tracking, and smart scheduling."
        },
        {
            id: 3,
            tag: "Innovation",
            title: "Integrating Tech in the Modern Classroom",
            image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600",
            description: "Balancing digital tools with traditional teaching methods for optimal student outcomes."
        },
        {
            id: 4,
            tag: "Student Success",
            title: "Study Hacks for the Digital Age",
            image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600",
            description: "Empowering students to take control of their learning using personalized dashboards."
        }
    ];

    return (
        <section id="insights-section" className="py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-3xl md:text-4xl font-heading text-brand-dark">Skooly Plus Resources & Insights</h2>
                    <a href="#" className="hidden sm:block text-brand-teal font-medium border-b-2 border-brand-green hover:text-brand-dark transition-colors pb-1">
                        View All Articles
                    </a>
                </div>

                <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {articles.map((article) => (
                        <a href="#" key={article.id} className="min-w-[280px] w-full snap-start group cursor-pointer">
                            <div className="aspect-[4/3] w-full mb-4 rounded-sm overflow-hidden relative">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-sm text-xs font-bold text-brand-teal">
                                    {article.tag}
                                </div>
                            </div>

                            <h3 className="font-heading text-xl text-brand-dark mb-2 group-hover:text-brand-teal transition-colors">
                                {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                {article.description}
                            </p>
                            <span className="text-sm text-brand-teal font-bold uppercase border-b border-brand-green pb-0.5 inline-block group-hover:text-brand-dark transition-colors">
                                Read More
                            </span>
                        </a>
                    ))}
                </div>

            </div>
        </section>
    );
}
