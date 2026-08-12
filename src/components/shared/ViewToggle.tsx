import { LayoutGrid, List } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ViewToggleProps {
    view: 'table' | 'grid';
    onChange: (view: 'table' | 'grid') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
    return (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
                onClick={() => onChange('table')}
                className={cn(
                    "p-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5",
                    view === 'table' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
                title="Table View"
            >
                <List className="h-4 w-4" />
            </button>
            <button
                onClick={() => onChange('grid')}
                className={cn(
                    "p-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5",
                    view === 'grid' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
                title="Grid / Kanban View"
            >
                <LayoutGrid className="h-4 w-4" />
            </button>
        </div>
    );
}
