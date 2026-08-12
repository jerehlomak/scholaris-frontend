import { motion } from 'framer-motion';

export function AlertBanner() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full bg-white rounded-2xl p-6 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-center justify-between shadow-sm border border-gray-100 border-l-4 border-l-dash-accent"
        >
            <div className="flex-1">
                <h2 className="text-dash-primary font-bold text-lg mb-1">Welcome to Admin Dashboard</h2>
                <p className="text-gray-600 font-medium text-sm">Your Account is not Verified yet!</p>
                <p className="text-gray-500 text-sm mt-1">
                    Please Verify your email address. <a href="#" className="text-dash-accent hover:underline font-bold">Verify now!</a>
                </p>
            </div>
        </motion.div>
    );
}
