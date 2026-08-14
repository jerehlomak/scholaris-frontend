import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalRecords?: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalRecords, onPageChange }: PaginationProps) {
    if (totalRecords === 0) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
            <div className="flex flex-col sm:flex-row w-full items-center justify-between gap-4">
                <div className="text-sm text-slate-700 w-full text-center sm:text-left">
                    Showing page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                    {totalRecords !== undefined && (
                        <>
                            {' '}(<span className="font-semibold">{totalRecords}</span> total records)
                        </>
                    )}
                </div>
                <div className="w-full overflow-x-auto pb-2 sm:pb-0 hide-scrollbar flex justify-center sm:justify-end">
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {getPageNumbers().map((page, index) => {
                            if (page === '...') {
                                return (
                                    <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 focus:outline-offset-0">
                                        ...
                                    </span>
                                );
                            }
                            const isCurrent = page === currentPage;
                            return (
                                <button
                                    key={`page-${page}`}
                                    onClick={() => onPageChange(page as number)}
                                    aria-current={isCurrent ? 'page' : undefined}
                                    className={cn(
                                        "relative inline-flex items-center px-3 sm:px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ring-1 ring-inset ring-slate-300 transition-colors",
                                        isCurrent
                                            ? "z-10 bg-[#1E4DA6] text-white ring-[#1E4DA6] hover:bg-[#173F8C]"
                                            : "text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}
