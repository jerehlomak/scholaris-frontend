
import { Instagram, Facebook, Youtube, ChevronDown } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-[#f8f9fa] pt-16 pb-8 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* Column 1: Navigation */}
                    <div>
                        <h4 className="font-bold text-brand-dark mb-6 text-lg">Product</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Features Overview</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">For Administrators</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">For Teachers</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Parent Portal</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Integrations</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Pricing Plans</a></li>
                        </ul>
                    </div>

                    {/* Column 2: Service */}
                    <div>
                        <h4 className="font-bold text-brand-dark mb-6 text-lg">Support</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Help Center & FAQ</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Implementation Guide</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Video Tutorials</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Contact Support</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">System Status</a></li>
                        </ul>
                    </div>

                    {/* Column 3: About */}
                    <div>
                        <h4 className="font-bold text-brand-dark mb-6 text-lg">Company</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">About Us</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Our Mission</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Careers</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Blog / Resources</a></li>
                            <li><a href="#" className="text-gray-600 hover:text-brand-teal transition-colors text-sm">Partner Program</a></li>
                        </ul>
                    </div>

                    {/* Column 4: Contact & Social */}
                    <div>
                        <h4 className="font-bold text-brand-dark mb-6 text-lg">Contact Sales</h4>
                        <p className="text-gray-600 text-sm mb-2">Email: sales@skoolyplus.com</p>
                        <p className="text-gray-600 text-sm mb-6">We aim to respond within 24 hours.</p>

                        <h4 className="font-bold text-brand-dark mb-4 text-lg">Follow Us</h4>
                        <div className="flex gap-4 mb-8">
                            <a href="#" className="text-brand-teal hover:text-brand-dark transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="#" className="text-brand-teal hover:text-brand-dark transition-colors"><Facebook className="w-5 h-5" /></a>
                            <a href="#" className="text-brand-teal hover:text-brand-dark transition-colors"><Youtube className="w-5 h-5" /></a>
                        </div>

                        <h4 className="font-bold text-brand-dark mb-4 text-lg">Certified Security</h4>
                        <div className="flex gap-2">
                            <div className="bg-white p-2 rounded-sm border border-gray-200 shadow-sm text-[10px] font-bold text-blue-800 flex items-center">FERPA</div>
                            <div className="bg-white p-2 rounded-sm border border-gray-200 shadow-sm text-[10px] font-bold text-green-700 flex items-center">GDPR</div>
                            <div className="bg-white p-2 rounded-sm border border-gray-200 shadow-sm text-[10px] font-bold flex items-center">SOC2</div>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-gray-500 text-xs text-center md:text-left">
                        &copy; {new Date().getFullYear()} Skooly Plus Inc. - All rights reserved.
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 text-xs">
                        <a href="#" className="text-gray-500 hover:text-brand-teal">Privacy Policy</a>
                        <a href="#" className="text-gray-500 hover:text-brand-teal">Terms of Service</a>
                        <a href="#" className="text-gray-500 hover:text-brand-teal">Cookie Settings</a>
                        <a href="#" className="text-gray-500 hover:text-brand-teal">Accessibility</a>
                    </div>

                    <div className="flex items-center gap-2 cursor-pointer text-sm text-gray-500">
                        <span>🇳🇬 English (NG)</span>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>

            </div>
        </footer>
    );
}
