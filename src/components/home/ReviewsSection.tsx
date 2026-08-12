
import { Star, CheckCircle } from 'lucide-react';

export function ReviewsSection() {
    const reviews = [
        {
            id: 1,
            name: "Sarah M. (Principal)",
            verified: true,
            text: "Skooly Plus completely transformed how we manage our administrative tasks. Our teachers save hours every week, and parents love the real-time updates.",
            rating: 5,
            date: "2 days ago"
        },
        {
            id: 2,
            name: "Thomas K. (IT Director)",
            verified: true,
            text: "The cloud infrastructure is incredibly robust. Implementation was seamless, and the support team was with us every step of the way.",
            rating: 5,
            date: "1 week ago"
        },
        {
            id: 3,
            name: "Julia R. (Teacher)",
            verified: true,
            text: "Finally, a grading system that actually makes sense! The automated reports are a lifesaver during parent-teacher conferences.",
            rating: 5,
            date: "2 weeks ago"
        }
    ];

    return (
        <section id="testimonial" className="py-20 bg-brand-gray-light">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                <div className="mb-12">
                    <div className="flex justify-center flex-wrap gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-8 h-8 fill-brand-green text-brand-green" />
                        ))}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-heading text-brand-dark mb-4">Trusted by over<br />5,000 schools worldwide</h2>
                    <p className="text-brand-dark/70 max-w-2xl mx-auto">
                        Based on verified feedback from educators and administrators.
                        See why schools are switching to Skooly Plus.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white p-8 rounded-sm shadow-sm flex flex-col h-full relative">
                            <div className="flex gap-0.5 mb-4">
                                {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-brand-green text-brand-green" />
                                ))}
                            </div>

                            <h4 className="font-bold text-lg text-brand-dark mb-1 flex items-center gap-2">
                                {review.name}
                                {review.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">{review.date}</p>

                            <p className="text-brand-dark leading-relaxed italic opacity-90 relative mb-4 flex-grow">
                                "{review.text}"
                            </p>

                            <div className="mt-auto flex items-center gap-2 pt-4 border-t border-gray-100">
                                <div className="flex bg-blue-100 p-1 rounded-full items-center">
                                    <span className="text-[10px] font-bold text-blue-800 px-2">Verified Educator</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12">
                    <button className="border-2 border-brand-teal text-brand-teal px-8 py-3 rounded-sm font-bold hover:bg-brand-teal hover:text-white transition-colors">
                        Read All Success Stories
                    </button>
                </div>

            </div>
        </section>
    );
}
