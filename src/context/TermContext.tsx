import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export interface AcademicTerm {
    id: string;
    sessionId: string;
    name: string; // e.g., "First Term 2025/2026"
    isActive: boolean;
    startDate?: string;
    endDate?: string;
}

interface TermContextType {
    terms: AcademicTerm[];
    activeTerm: AcademicTerm | null;
    viewingTerm: AcademicTerm | null;
    setViewingTerm: (term: AcademicTerm) => void;
    activateTerm: (termId: string) => Promise<void>;
    addTerm: (term: Omit<AcademicTerm, 'id'>) => Promise<void>;
    fetchTerms: () => Promise<void>;
    isLoading: boolean;
}

const TermContext = createContext<TermContextType | undefined>(undefined);

export const TermProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const activeTerm = terms.find((t) => t.isActive) || null;
    const [viewingTerm, setViewingTerm] = useState<AcademicTerm | null>(null);

    const fetchTerms = async () => {
        try {
            const res = await axios.get('/api/v1/terms', { withCredentials: true });
            setTerms(res.data.terms);
            
            const currentActive = res.data.terms.find((t: AcademicTerm) => t.isActive);
            if (currentActive && !viewingTerm) {
                setViewingTerm(currentActive);
            }
        } catch (error) {
            console.error('Failed to fetch terms', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTerms();
        } else {
            setTerms([]);
            setViewingTerm(null);
        }
    }, [user]);

    const activateTerm = async (termId: string) => {
        try {
            const term = terms.find(t => t.id === termId);
            if (!term) return;

            await axios.put(`/api/v1/terms/${termId}`, { isActive: true }, { withCredentials: true });
            
            await fetchTerms();
            toast.success('Term activated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to activate term');
        }
    };

    const addTerm = async (termData: Omit<AcademicTerm, 'id'>) => {
        try {
            await axios.post('/api/v1/terms', termData, { withCredentials: true });
            await fetchTerms();
            toast.success('Term created successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to create term');
        }
    };

    return (
        <TermContext.Provider
            value={{
                terms,
                activeTerm,
                viewingTerm,
                setViewingTerm,
                activateTerm,
                addTerm,
                fetchTerms,
                isLoading
            }}
        >
            {children}
        </TermContext.Provider>
    );
};

export const useTerm = () => {
    const context = useContext(TermContext);
    if (context === undefined) {
        throw new Error('useTerm must be used within a TermProvider');
    }
    return context;
};
