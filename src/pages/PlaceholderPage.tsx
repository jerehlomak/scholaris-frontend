import { Header } from '../components/home/Header';
import { Footer } from '../components/home/Footer';

interface PlaceholderProps {
    title: string;
}

export default function PlaceholderPage({ title }: PlaceholderProps) {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center bg-gray-50">
                <div className="text-center px-4 max-w-2xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E4DA6] font-heading mb-6">
                        {title}
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        We're currently building out this section of Skooly Plus. Check back soon for more details!
                    </p>
                    <a href="/" className="inline-block bg-[#5cb85c] text-white px-8 py-3 rounded font-bold shadow hover:bg-opacity-90 transition-all uppercase tracking-wider text-sm">
                        Back to Home
                    </a>
                </div>
            </main>
            <Footer />
        </div>
    );
}
