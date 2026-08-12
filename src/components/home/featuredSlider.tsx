
import { Star } from 'lucide-react';

export function FeaturedSlider() {
    const products = [
        {
            id: 1,
            title: "Student Information System",
            description: "Manage student data securely from enrollment to graduation.",
            price: "Included",
            oldPrice: "",
            rating: 4.9,
            reviews: 1245,
            image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400"
        },
        {
            id: 2,
            title: "Automated Grading",
            description: "Powerful grading tools tailored to modern teaching standards.",
            price: "Premium",
            rating: 4.8,
            reviews: 890,
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400"
        },
        {
            id: 3,
            title: "Parent Communication HUB",
            description: "Keep parents informed with real-time updates and messaging.",
            price: "Core Feature",
            rating: 5.0,
            reviews: 2130,
            image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400"
        },
        {
            id: 4,
            title: "Smart Scheduling",
            description: "Conflict-free timetabling with AI-driven schedule generation.",
            price: "Add-on",
            rating: 4.7,
            reviews: 540,
            image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600"
        }
    ];

    return (
        <section id="features-section" className="py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-3xl md:text-4xl font-heading text-brand-dark">Featured Modules</h2>
                    <a href="#" className="hidden sm:block text-brand-teal font-medium border-b-2 border-brand-green hover:text-brand-dark transition-colors pb-1">
                        View All Features
                    </a>
                </div>

                {/* CSS Scroll Snap Container for Slider */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {products.map((product) => (
                        <div key={product.id} className="min-w-[280px] w-full snap-start bg-brand-gray-light p-4 rounded-sm flex flex-col group cursor-pointer relative transition-transform hover:-translate-y-1 hover:shadow-lg">

                            {/* Image */}
                            <div className="aspect-square w-full mb-4 bg-white rounded-sm overflow-hidden flex items-center justify-center p-4">
                                <img src={product.image} alt={product.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-grow">
                                <div className="flex items-center gap-1 mb-2">
                                    <Star className="w-4 h-4 fill-brand-green text-brand-green" />
                                    <span className="text-sm font-bold text-brand-dark">{product.rating}</span>
                                    <span className="text-xs text-gray-500">({product.reviews})</span>
                                </div>

                                <h3 className="font-bold text-brand-dark text-[15px] mb-1 leading-tight">{product.title}</h3>
                                <p className="text-xs text-brand-dark opacity-70 mb-4 line-clamp-2">{product.description}</p>

                                <div className="mt-auto pt-4 flex flex-col gap-3">
                                    <div className="flex items-end gap-2 text-brand-dark">
                                        <span className="font-bold text-lg">{product.price}</span>
                                        {product.oldPrice && (
                                            <span className="text-sm line-through opacity-50 mb-0.5">{product.oldPrice}</span>
                                        )}
                                    </div>

                                    <button className="w-full bg-brand-teal text-white py-3 rounded-sm font-bold text-sm tracking-wide hover:bg-brand-dark transition-colors">
                                        Learn More
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
