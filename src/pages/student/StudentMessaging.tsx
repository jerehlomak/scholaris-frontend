import { ChatApp } from '../../components/chat/ChatApp';
import { Home as HomeIcon, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentMessaging() {
    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Chat & Messaging</h1>
                    <div className="flex items-center text-xs text-slate-400 gap-1 mt-1">
                        <HomeIcon size={12} />
                        <Link to="/student" className="hover:text-blue-600 transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>Messaging</span>
                    </div>
                </div>
            </div>
            <ChatApp role="student" userName="Ayomide Balogun" />
        </div>
    );
}
