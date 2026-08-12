/**
 * NotFound.tsx — 404 page for unmatched routes
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] via-white to-[#f0fdf4] flex items-center justify-center p-6 font-dash">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-md">
                {/* Large 404 */}
                <div className="relative mb-6">
                    <p className="text-[10rem] font-black text-[#0036a1]/5 leading-none select-none">404</p>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-[#0036a1] rounded-3xl flex items-center justify-center shadow-xl shadow-[#0036a1]/30">
                            <span className="text-4xl">🔍</span>
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-3">Page Not Found</h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Oops! The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-[#0036a1] hover:text-[#0036a1] transition-all">
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </button>
                    <Link to="/" className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0036a1] text-white rounded-xl font-semibold hover:bg-[#001761] transition-all shadow-lg shadow-[#0036a1]/30">
                        <Home className="w-4 h-4" /> Return Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
