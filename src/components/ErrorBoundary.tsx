import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    errorMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            
            return (
                <div className="p-4 m-4 border-2 border-red-200 bg-red-50 rounded-xl flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                    <h2 className="text-red-700 font-bold mb-1">Failed to render component</h2>
                    <p className="text-sm text-red-600 max-w-md break-words">
                        {this.props.errorMessage || this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
