import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const location = useLocation();

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen font-dash bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 print:min-h-0 print:h-auto print:block">
            <div className="print:hidden">
                <Navbar
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
            </div>

            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-30 bg-black/60 md:hidden print:hidden"
                    onClick={() => setIsSidebarOpen(false)} />
            )}

            <div className="print:hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            </div>

            <main
                className={`pt-16 pb-6 transition-all duration-300 ease-in-out min-h-screen ${isSidebarOpen ? 'md:ms-[280px]' : 'md:ms-[80px]'
                    } print:pt-0 print:ms-0 print:m-0 print:p-0 print:bg-white print:text-black print:block print:min-h-0 print:h-auto`}
            >
                <div className="p-2 md:p-6 lg:p-8 max-w-[1600px] mx-auto print:max-w-none print:m-0 print:p-0 print:block">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
