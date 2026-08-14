import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Menu, X, ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { SkcoolyWordmark } from '../shared/SkcoolyWordmark';

const NAVY = '#15316B';
const NAVY_DEEP = '#0E2450';
const GOLD = '#F5B800';

const NAV_LINKS = [
    { id: 'features-section', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'our-mission', label: 'Our Mission' },
    { id: 'why-skcooly', label: 'Why Skcooly' },
    { id: 'contact-section', label: 'Contact' },
];

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const menuVariants: Variants = {
        closed: { opacity: 0, x: '-100%' },
        open: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
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
        <>
        <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-[#EEEAE0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Mobile Menu Icon */}
                    <div className="flex items-center lg:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-slate-600 hover:text-[#15316B] transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer">
                        <SkcoolyWordmark size="md" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
                        {NAV_LINKS.map(link => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={(e) => scrollToSection(e, link.id)}
                                className="text-slate-600 hover:text-[#15316B] font-medium text-[15px] border-b-2 border-transparent hover:border-[#F5B800] py-2 transition-all"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Right Icons / Buttons */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="hidden sm:flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-bold shadow-sm transition-all text-sm"
                                    style={{ backgroundColor: NAVY }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = NAVY_DEEP)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = NAVY)}>
                                    Dashboard
                                </Link>
                                <Link to="/apply" className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full font-bold shadow-sm transition-all text-sm"
                                    style={{ backgroundColor: GOLD, color: NAVY_DEEP }}>
                                    <FileText className="w-4 h-4" />
                                    Apply
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/portal/login" className="hidden sm:flex items-center gap-2 text-slate-700 hover:text-[#15316B] font-bold transition-colors">
                                    <User className="w-5 h-5" />
                                    Login
                                </Link>
                                <Link to="/apply" className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full font-bold shadow-sm transition-all text-sm"
                                    style={{ backgroundColor: GOLD, color: NAVY_DEEP }}>
                                    <FileText className="w-4 h-4" />
                                    Apply
                                </Link>
                                <Link to="/get-started" className="hidden lg:flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-bold shadow-sm transition-all text-sm"
                                    style={{ backgroundColor: NAVY }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = NAVY_DEEP)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = NAVY)}>
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </header>

        {/* Mobile Menu Overlay — rendered via portal straight into <body>, deliberately
            *outside* <header>. The header has `backdrop-blur-sm` for its own sticky
            frosted-glass look, and `backdrop-filter` (like `transform`) creates a new
            containing block for `position: fixed` descendants — any fixed overlay
            nested inside it gets sized/positioned relative to the header's own small
            box instead of the viewport, not the full screen it's meant to cover. A
            portal sidesteps the whole category of "trapped by a filtered/transformed
            ancestor" bug rather than trying to keep the header filter-free forever. */}
        {createPortal(
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-[#0B1F4E]/50 backdrop-blur-sm z-[100] lg:hidden"
                        />
                        <motion.div
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={menuVariants}
                            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl z-[101] lg:hidden flex flex-col overflow-y-auto"
                        >
                            {/* Gold top accent */}
                            <div className="h-1 w-full shrink-0" style={{ backgroundColor: GOLD }} />

                            <div className="flex items-center justify-between p-6 border-b border-[#EEEAE0]">
                                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                                    <SkcoolyWordmark size="sm" />
                                </Link>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 py-4 px-3 flex flex-col">
                                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 px-4 mb-1 mt-2">Menu</span>
                                {NAV_LINKS.map(link => (
                                    <a
                                        key={link.id}
                                        href={`#${link.id}`}
                                        onClick={(e) => { scrollToSection(e, link.id); setIsMobileMenuOpen(false); }}
                                        className="group flex items-center justify-between text-[15px] font-semibold text-slate-700 hover:text-[#15316B] py-3.5 px-4 rounded-xl hover:bg-[#FBF9F5] transition-colors border-b border-slate-50 last:border-b-0"
                                    >
                                        {link.label}
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#F5B800] group-hover:translate-x-0.5 transition-all" />
                                    </a>
                                ))}
                            </div>

                            <motion.div
                                className="p-5 border-t border-[#EEEAE0] space-y-2.5 bg-[#FBF9F5]"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {user ? (
                                    <>
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-12 flex items-center justify-center gap-2 text-white font-bold rounded-xl shadow-sm transition-colors"
                                            style={{ backgroundColor: NAVY }}
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/apply"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-12 flex items-center justify-center gap-2 font-bold rounded-xl shadow-sm transition-colors"
                                            style={{ backgroundColor: GOLD, color: NAVY_DEEP }}
                                        >
                                            <FileText className="w-5 h-5" />
                                            Apply
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/get-started"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-12 flex items-center justify-center gap-2 text-white font-bold rounded-xl shadow-sm transition-colors"
                                            style={{ backgroundColor: NAVY }}
                                        >
                                            Get Started <ArrowRight className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            to="/apply"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-12 flex items-center justify-center gap-2 font-bold rounded-xl shadow-sm transition-colors"
                                            style={{ backgroundColor: GOLD, color: NAVY_DEEP }}
                                        >
                                            <FileText className="w-5 h-5" />
                                            Apply
                                        </Link>
                                        <Link
                                            to="/portal/login"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-full h-11 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            <User className="w-4 h-4" />
                                            Login
                                        </Link>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        )}
        </>
    );
}
