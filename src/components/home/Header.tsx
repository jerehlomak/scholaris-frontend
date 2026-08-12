import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, User, Menu, X, ArrowRight, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import logo from '../../assets/SkcoolyPlus.png';

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
        const { user } = useAuth();
        const navigate = useNavigate();

    const menuVariants: Variants = {
        closed: { opacity: 0, x: "-100%" },
        open: {
            opacity: 1,
            x: 0,
            transition: { type: "spring", stiffness: 300, damping: 30 }
        }
    };

    const linkVariants: Variants = {
        closed: { opacity: 0, y: 20 },
        open: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }
        })
    };

    const scrollToSection = (e: React.MouseEvent, targetId: string) => {
        e.preventDefault();
        if (window.location.pathname !== '/') {
            navigate(`/#${targetId}`);
        } else {
            const el = document.getElementById(targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Mobile Menu Icon */}
                    <div className="flex items-center lg:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-gray-600 hover:text-brand-teal transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer">
                        <img src={logo} alt="Skooly Plus Logo" className="h-24 w-28 md:w-32 object-contain" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
                        <a href="#features-section" onClick={(e) => scrollToSection(e, 'features-section')} className="text-brand-dark hover:text-brand-teal font-medium text-[15px] border-b-2 border-transparent hover:border-brand-green py-2 transition-all">Features</a>
                        <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-brand-dark hover:text-brand-teal font-medium text-[15px] border-b-2 border-transparent hover:border-brand-green py-2 transition-all">Pricing</a>
                        <a href="#our-mission" onClick={(e) => scrollToSection(e, 'our-mission')} className="text-brand-dark hover:text-brand-teal font-medium text-[15px] border-b-2 border-transparent hover:border-brand-green py-2 transition-all">Our Mission</a>
                        <a href="#testimonial" onClick={(e) => scrollToSection(e, 'testimonial')} className="text-brand-dark hover:text-brand-teal font-medium text-[15px] border-b-2 border-transparent hover:border-brand-green py-2 transition-all">Testimonial</a>
                        <a href="#insights-section" onClick={(e) => scrollToSection(e, 'insights-section')} className="text-brand-dark hover:text-brand-teal font-medium text-[15px] border-b-2 border-transparent hover:border-brand-green py-2 transition-all">Blog</a>
                        <a href="#contact-section" onClick={(e) => scrollToSection(e, 'contact-section')} className="text-brand-dark hover:text-brand-teal font-medium text-[15px] border-b-2 border-transparent hover:border-brand-green py-2 transition-all">Contact</a>
                    </nav>

                    {/* Right Icons / Buttons */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="hidden sm:flex items-center gap-2 bg-[#1a2fa0] text-white px-5 py-2.5 rounded-sm font-bold shadow-md hover:bg-[#121f6e] transition-all uppercase tracking-wider text-sm">
                                    Dashboard
                                </Link>
                                <Link to="/apply" className="hidden sm:flex items-center gap-2 bg-brand-green text-white px-5 py-2.5 rounded-sm font-bold shadow-md hover:bg-opacity-90 transition-all uppercase tracking-wider text-sm">
                                    <FileText className="w-4 h-4" />
                                    Apply
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/portal/login" className="hidden sm:flex items-center gap-2 text-brand-dark hover:text-brand-teal font-bold transition-colors">
                                    <User className="w-5 h-5" />
                                    Login
                                </Link>
                                <Link to="/apply" className="hidden sm:flex items-center gap-2 bg-brand-green text-white px-5 py-2.5 rounded-sm font-bold shadow-md hover:bg-opacity-90 transition-all uppercase tracking-wider text-sm">
                                    <FileText className="w-4 h-4" />
                                    Apply
                                </Link>
                                <Link to="/get-started" className="hidden lg:flex items-center gap-2 bg-[#1a2fa0] text-white px-5 py-2.5 rounded-sm font-bold shadow-md hover:bg-[#121f6e] transition-all uppercase tracking-wider text-sm">
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.div
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={menuVariants}
                            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl z-50 lg:hidden flex flex-col overflow-y-auto"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                                    <img src={logo} alt="Skooly Plus Logo" className="h-auto w-24 object-contain" />
                                </Link>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-gray-400 hover:text-brand-danger bg-gray-50 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 py-6 px-4 flex flex-col space-y-2">
                                <a href="#features-section" onClick={(e) => { scrollToSection(e, 'features-section'); setIsMobileMenuOpen(false); }} className="text-lg font-primary font-semibold text-brand-dark hover:text-brand-green py-3 px-4 rounded-xl hover:bg-brand-gray-light transition-colors">Features</a>
                                <a href="#pricing" onClick={(e) => { scrollToSection(e, 'pricing'); setIsMobileMenuOpen(false); }} className="text-lg font-primary font-semibold text-brand-dark hover:text-brand-green py-3 px-4 rounded-xl hover:bg-brand-gray-light transition-colors">Pricing</a>
                                <a href="#our-mission" onClick={(e) => { scrollToSection(e, 'our-mission'); setIsMobileMenuOpen(false); }} className="text-lg font-primary font-semibold text-brand-dark hover:text-brand-green py-3 px-4 rounded-xl hover:bg-brand-gray-light transition-colors">Our Mission</a>
                                <a href="#testimonial" onClick={(e) => { scrollToSection(e, 'testimonial'); setIsMobileMenuOpen(false); }} className="text-lg font-primary font-semibold text-brand-dark hover:text-brand-green py-3 px-4 rounded-xl hover:bg-brand-gray-light transition-colors">Testimonial</a>
                                <a href="#insights-section" onClick={(e) => { scrollToSection(e, 'insights-section'); setIsMobileMenuOpen(false); }} className="text-lg font-primary font-semibold text-brand-dark hover:text-brand-green py-3 px-4 rounded-xl hover:bg-brand-gray-light transition-colors">Blog</a>
                                <a href="#contact-section" onClick={(e) => { scrollToSection(e, 'contact-section'); setIsMobileMenuOpen(false); }} className="text-lg font-primary font-semibold text-brand-dark hover:text-brand-green py-3 px-4 rounded-xl hover:bg-brand-gray-light transition-colors">Contact</a>
                            </div>

                            <motion.div
                                className="p-6 border-t border-gray-100 space-y-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {user ? (
                                    <>
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-12 flex items-center justify-center gap-2 bg-[#1a2fa0] text-white font-bold rounded-xl shadow-lg hover:bg-[#121f6e] transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/apply"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-12 flex items-center justify-center gap-2 bg-brand-green text-white font-bold rounded-xl shadow-lg shadow-brand-green/30 hover:bg-opacity-90 transition-colors"
                                        >
                                            <FileText className="w-5 h-5" />
                                            Apply
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/portal/login"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-12 flex items-center justify-center gap-2 bg-brand-gray-light text-brand-dark font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            <User className="w-5 h-5" />
                                            Login
                                        </Link>
                                        <Link
                                            to="/apply"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-12 flex items-center justify-center gap-2 bg-brand-green text-white font-bold rounded-xl shadow-lg shadow-brand-green/30 hover:bg-opacity-90 transition-colors"
                                        >
                                            <FileText className="w-5 h-5" />
                                            Apply
                                        </Link>
                                        <Link
                                            to="/get-started"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-12 flex items-center justify-center gap-2 bg-[#1a2fa0] text-white font-bold rounded-xl shadow-lg hover:bg-[#121f6e] transition-colors"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
