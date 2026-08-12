import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface Branch {
    id: string;
    schoolId: string;
    name: string;
    code: string | null;
    status: string;
}

interface BranchContextType {
    activeBranchId: string | null;
    availableBranches: Branch[];
    isLoadingBranches: boolean;
    switchBranch: (branchId: string) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
    const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);

    // Fetch branches if user is a school-admin/super-admin
    useEffect(() => {
        const fetchBranches = async () => {
            if (!user || !user.schoolId) return;
            
            // Only school-wide admins need the full list
            if (['SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'].includes(user.role)) {
                try {
                    setIsLoadingBranches(true);
                    const response = await axios.get(`/api/v1/branches?schoolId=${user.schoolId}`);
                    setAvailableBranches(response.data.branches || []);
                } catch (error) {
                    console.error('Failed to fetch branches', error);
                } finally {
                    setIsLoadingBranches(false);
                }
            } else if (user.branch) {
                // Branch-restricted users just have their own branch
                setAvailableBranches([{ ...user.branch, schoolId: user.schoolId || '', status: 'Active' } as Branch]);
                setActiveBranchId(user.branch.id);
            }
        };

        fetchBranches();
    }, [user]);

    // Initialize or restore active branch from storage
    useEffect(() => {
        if (!user) {
            setActiveBranchId(null);
            return;
        }

        // If user is restricted to a branch, force it
        if (user.branchId) {
            setActiveBranchId(user.branchId);
            localStorage.setItem('skooly_active_branch', user.branchId);
            return;
        }

        // For Super Admins, restore from local storage if exists
        if (['SCHOOL_SUPER_ADMIN'].includes(user.role)) {
            const stored = localStorage.getItem('skooly_active_branch');
            if (stored) {
                setActiveBranchId(stored);
            } else {
                setActiveBranchId('all'); // default to all branches scope
            }
        }
    }, [user]);

    const switchBranch = (branchId: string) => {
        if (!user || user.role !== 'SCHOOL_SUPER_ADMIN') {
            toast.error("You do not have permission to switch branch contexts.");
            return;
        }

        setActiveBranchId(branchId);
        localStorage.setItem('skooly_active_branch', branchId);
        toast.success(`Context switched. Reloading...`);
        // Force a reload to ensure all data is refetched with the new header
        setTimeout(() => window.location.reload(), 500);
    };

    return (
        <BranchContext.Provider value={{
            activeBranchId,
            availableBranches,
            isLoadingBranches,
            switchBranch
        }}>
            {children}
        </BranchContext.Provider>
    );
};

export const useBranch = () => {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error('useBranch must be used within a BranchProvider');
    }
    return context;
};
