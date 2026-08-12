import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Play } from 'lucide-react';

interface Props {
    joinCode: string;
    onCodeChange: (v: string) => void;
    onJoin: () => void;
}

export function JoinClassCard({ joinCode, onCodeChange, onJoin }: Props) {
    return (
        <Card className="bg-[#0036a1] text-white overflow-hidden shadow-lg">
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
                <Play className="w-5 h-5 text-[#ff9800]" />
                <h3 className="font-bold">Join a Class</h3>
            </div>
            <div className="p-8 flex flex-col items-center justify-center gap-5 h-48">
                <p className="text-blue-200 text-sm text-center">Enter a class code or paste the meeting link to join</p>
                <div className="flex w-full gap-3">
                    <input
                        value={joinCode}
                        onChange={e => onCodeChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onJoin()}
                        type="text"
                        placeholder="Enter class code..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder-blue-300 outline-none focus:border-[#ff9800]"
                    />
                    <Button onClick={onJoin} className="bg-[#ff9800] hover:bg-[#f57c00] text-white font-bold px-6 shrink-0">
                        Join
                    </Button>
                </div>
            </div>
        </Card>
    );
}
