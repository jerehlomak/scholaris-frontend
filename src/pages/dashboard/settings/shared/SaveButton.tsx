import { Save, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from './../../../../lib/utils';

interface SaveButtonProps {
    onClick: () => void;
    saved: boolean;
    saving?: boolean;
    savedLabel?: string;
    saveLabel?: string;
    disabled?: boolean;
}

export function SaveButton({
    onClick,
    saved,
    saving = false,
    savedLabel = 'Saved Successfully!',
    saveLabel = 'Save Configuration',
    disabled = false,
}: SaveButtonProps) {
    return (
        <div className="flex justify-center">
            <button
                onClick={onClick}
                disabled={disabled || saving}
                className={cn(
                    'h-12 w-full max-w-xs gap-2.5 rounded-full px-8 text-sm font-bold tracking-tight shadow-lg',
                    'flex items-center justify-center transition-all duration-500',
                    saved
                        ? 'scale-[1.03] bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600 text-white'
                        : disabled
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#173F8C] shadow-[#1E4DA6]/20 hover:scale-[1.02] hover:bg-[#122F69] hover:shadow-[#1E4DA6]/35 text-white'
                )}
            >
                {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : saved ? (
                    <><CheckCircle2 className="h-4 w-4" /> {savedLabel}</>
                ) : (
                    <><Save className="h-4 w-4" /> {saveLabel}</>
                )}
            </button>
        </div>
    );
}
