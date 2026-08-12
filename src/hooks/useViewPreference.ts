import { useState, useEffect } from 'react';

export function useViewPreference(key: string, defaultValue: 'table' | 'grid' = 'table') {
    const [view, setView] = useState<'table' | 'grid'>(() => {
        try {
            const stored = localStorage.getItem('skooly_view_' + key);
            if (stored === 'table' || stored === 'grid') return stored;
        } catch(e) {}
        return defaultValue;
    });

    useEffect(() => {
        try {
            localStorage.setItem('skooly_view_' + key, view);
        } catch(e) {}
    }, [key, view]);

    return [view, setView] as const;
}