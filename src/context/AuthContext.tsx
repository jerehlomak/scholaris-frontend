import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// Define User Type based on our Prisma Schema Return
export interface User {
    id: string;
    userId?: string; // Kept for backwards compatibility if needed
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'GROUP_ADMIN' | 'SCHOOL_SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'BRANCH_ADMIN' | 'BRANCH_STAFF';
    schoolId?: string | null;
    groupId?: string | null;
    branchId?: string | null;
    branch?: { id: string; name: string; code: string | null } | null;
    school?: {
        id: string;
        name: string;
        status?: string;
        group?: { id: string; name: string } | null;
        plan?: {
            id: string;
            name: string;
            features: string[];
        };
        logoUrl?: string | null;
        blockedFeatures?: string[];
        featureFlags?: { feature: string; enabled: boolean }[];
    };
    studentProfile?: any;
    teacherProfile?: any;
    parentProfile?: any;
    customRole?: {
        id: string;
        name: string;
    } | null;
    customRoleId?: string | null;
    // Resolved by the backend's three-layer RBAC system (see permissions.service.js) —
    // `permissions` is the flat set of STAFF-dashboard menu item keys this user can
    // currently use; `enabledDashboards` is which of the four portals are turned on
    // for this school at all (central-admin controlled).
    permissions?: string[];
    enabledDashboards?: ('STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF')[];
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<User | null>;
    groupLogin: (credentials: any) => Promise<User | null>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set default axios withCredentials to true for cross-origin cookie sharing
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

// Global Axios Interceptor for Branch Context Header
axios.interceptors.request.use((config) => {
    const activeBranch = localStorage.getItem('skooly_active_branch');
    if (activeBranch) {
        config.headers['x-active-branch'] = activeBranch;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkSession = async () => {
        try {
            const response = await axios.get('/api/v1/users/showMe');
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load: Check if user is already logged in (verify HTTP-only cookie)
    useEffect(() => {
        checkSession();
    }, []);

    const refreshSession = async () => {
        await checkSession();
    };

    const login = async (credentials: any): Promise<User | null> => {
        try {
            const response = await axios.post('/api/v1/auth/login', credentials);
            const loggedInUser = response.data.user;
            setUser(loggedInUser);
            toast.success("Login Successful!");
            return loggedInUser;
        } catch (error: any) {
            // If account is restricted, skip the generic toast — the login page shows its own UI
            if (error.response?.data?.isRestricted) {
                throw error; // re-throw original so caller can read response.data
            }
            const errorMsg = error.response?.data?.msg || "Login failed. Please check your credentials.";
            toast.error(errorMsg);
            throw error; // re-throw original so caller can still inspect response.data if needed
        }
    };

    const groupLogin = async (credentials: any): Promise<User | null> => {
        try {
            const response = await axios.post('/api/v1/group-admin/login', credentials);
            const loggedInUser = response.data.user;
            setUser(loggedInUser);
            toast.success("Group Login Successful!");
            return loggedInUser;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.msg || "Login failed. Please check your credentials.";
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }
    };

    const logout = async () => {
        try {
            await axios.get('/api/v1/auth/logout');
            window.location.href = '/'; // Hard redirect to clear all states and go to main home page
        } catch (error: any) {
            toast.error("Failed to logout");
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, groupLogin, logout, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
