import { useState, useEffect } from 'react';

const IMAGES = [
    'https://images.unsplash.com/photo-1617056239820-8ce90ba48193?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1628198661856-102874fb9d82?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2000&auto=format&fit=crop'
];

export function HeroBanner() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const scrollToFeatures = () => {
        const el = document.getElementById('features-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] flex items-center overflow-hidden bg-gradient-to-br from-[#1a2fa0] to-[#121f6e]/50">
            {/* Background Slideshow */}
            {IMAGES.map((img, idx) => (
                <div
                    key={img}
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-80' : 'opacity-0'}`}
                    style={{ backgroundImage: `url("${img}")` }}
                ></div>
            ))}

            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/30 z-10"></div>

            {/* Content Container */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center sm:text-left">
                <h1 className="text-white text-2xl sm:text-3xl md:text-5xl lg:text-[80px] font-heading leading-tight mb-6 max-w-4xl drop-shadow-md">
                    Empower your <br className="hidden sm:block" /> entire school <br className="hidden sm:block" /> with Skooly Plus.
                </h1>
                <p className="text-white text-lg sm:text-xl font-secondary mb-8 max-w-2xl drop-shadow-sm">
                    Discover the all-in-one platform built to simplify administration, engage parents, and inspire students.
                </p>
                <button
                    onClick={scrollToFeatures}
                    className="bg-brand-green text-white cursor-pointer px-8 py-4 rounded-sm text-base font-bold hover:bg-white hover:text-brand-green transition-colors uppercase tracking-wider shadow-lg">
                    Explore Platform Features
                </button>
            </div>
        </section>
    );
}
