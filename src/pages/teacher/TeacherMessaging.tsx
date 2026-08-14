import { ChatApp } from '../../components/chat/ChatApp';
import { Home as HomeIcon, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherMessaging() {
    return (
        <div className="max-w-[1200px] mx-auto w-full font-dash pb-6">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chat & Messaging</h1>
                    <div className="flex items-center text-xs text-gray-400 gap-1 mt-1">
                        <HomeIcon size={12} />
                        <Link to="/teacher" className="hover:text-[#1E4DA6] transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>Messaging</span>
                    </div>
                </div>
            </div>
            <ChatApp role="teacher" userName="Mr. Adebayo" />
        </div>
    );
}
