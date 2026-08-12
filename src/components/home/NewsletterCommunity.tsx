
import { ArrowRight, Instagram, Facebook, Youtube } from 'lucide-react';

export function NewsletterCommunity() {
    return (
        <section className="py-20 bg-brand-gray-light">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-sm shadow-sm overflow-hidden flex flex-col lg:flex-row">

                    {/* Newsletter Section */}
                    <div className="lg:w-1/2 p-8 md:p-12 xl:p-16 flex flex-col justify-center">
                        <h2 className="text-3xl md:text-4xl font-heading text-brand-dark mb-4 drop-shadow-sm">
                            Skooly Plus Educator Community
                        </h2>
                        <p className="text-brand-dark/80 mb-8 max-w-md text-sm md:text-base leading-relaxed">
                            Join thousands of forward-thinking educators. Get exclusive access to webinars,
                            case studies, platform updates, and best practices delivered right to your inbox.
                        </p>

                        <form className="flex flex-col gap-4 max-w-md">
                            <input
                                type="email"
                                placeholder="School Email Address"
                                className="w-full border border-gray-300 rounded-sm px-4 py-3 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
                            />
                            <button
                                type="button"
                                className="w-full bg-brand-teal text-white font-bold py-3 px-4 rounded-sm flex justify-between items-center hover:bg-brand-dark transition-colors"
                            >
                                Join the Community
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <p className="text-[10px] text-gray-500 mt-2">
                                By subscribing, you agree to our Privacy Policy. You can unsubscribe at any time.
                            </p>
                        </form>
                    </div>

                    {/* Image/Social Section */}
                    <div className="lg:w-1/2 relative min-h-[400px]">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000")' }}
                        ></div>
                        <div className="absolute inset-0 bg-brand-teal/80 flex flex-col justify-center items-center text-white p-8 text-center">
                            <h3 className="font-heading text-3xl mb-4 text-white">Connect on <br /> social media</h3>
                            <p className="mb-8 opacity-90 text-sm max-w-xs">
                                Share your school's success stories with #Skooly Plus and connect with a global network of educators.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-white hover:text-brand-teal transition-all">
                                    <Instagram className="w-6 h-6" />
                                </a>
                                <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-white hover:text-brand-teal transition-all">
                                    <Facebook className="w-6 h-6" />
                                </a>
                                <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-white hover:text-brand-teal transition-all">
                                    <Youtube className="w-6 h-6" />
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
