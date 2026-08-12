
export function AboutBanner() {
    return (
        <section id="our-mission" className="bg-brand-teal text-white py-20 lg:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <div className="order-2 lg:order-1 text-center lg:text-left">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading mb-6 drop-shadow-sm leading-tight text-white tracking-tight">
                            We believe in the<br />power of education.
                        </h2>
                        <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                            Skooly Plus stands for innovation, streamlined workflows, and empowering educators.
                            We believe that great software is the foundation for creating an environment where students can truly thrive.
                            Built by educators. For your school.
                        </p>
                        <button className="bg-transparent border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-teal hover:text-white cursor-pointer px-8 py-4 rounded-sm font-bold tracking-wider transition-all uppercase text-sm">
                            Learn more about our mission
                        </button>
                    </div>

                    {/* Image Grid / Collage */}
                    <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <img
                                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600"
                                alt="Students in class"
                                className="w-full h-48 md:h-64 object-cover rounded-sm shadow-xl"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600"
                                alt="Studying"
                                className="w-full h-32 md:h-48 object-cover rounded-sm shadow-lg"
                            />
                        </div>
                        <div className="space-y-4 pt-8">
                            <img
                                src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=600"
                                alt="Teacher at whiteboard"
                                className="w-full h-64 md:h-80 object-cover rounded-sm shadow-xl"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
