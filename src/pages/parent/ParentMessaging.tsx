/**
 * ParentMessaging.tsx — Parent chat with teachers and school admin
 * Reuses the shared ChatApp component with parent-role conversations
 */
import { ChatApp } from '../../components/chat/ChatApp';
import { Home as HomeIcon, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ParentMessaging() {
    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                    <p className="text-slate-500 text-sm mt-1">Communicate with teachers and staff.</p>
                </div>
            </div>
            <ChatApp role="student" userName="Parent" />
        </div>
    );
}
