import * as React from 'react';
import { cn } from '../../lib/utils';

interface TabsContextValue { value: string; onValueChange: (v: string) => void; }
const TabsContext = React.createContext<TabsContextValue>({ value: '', onValueChange: () => {} });

interface TabsProps { defaultValue?: string; value?: string; onValueChange?: (v: string) => void; children: React.ReactNode; className?: string; }
export function Tabs({ defaultValue = '', value, onValueChange, children, className }: TabsProps) {
    const [internal, setInternal] = React.useState(defaultValue);
    const current = value ?? internal;
    const update = (v: string) => { setInternal(v); onValueChange?.(v); };
    return (
        <TabsContext.Provider value={{ value: current, onValueChange: update }}>
            <div className={cn('flex flex-col', className)}>{children}</div>
        </TabsContext.Provider>
    );
}

interface TabsListProps { children: React.ReactNode; className?: string; }
export function TabsList({ children, className }: TabsListProps) {
    return <div className={cn('flex items-center', className)}>{children}</div>;
}

interface TabsTriggerProps { value: string; children: React.ReactNode; className?: string; }
export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
    const ctx = React.useContext(TabsContext);
    const active = ctx.value === value;
    return (
        <button
            type="button"
            onClick={() => ctx.onValueChange(value)}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                active ? 'bg-white text-foreground shadow-sm data-[state=active]:text-[#0036a1]' : 'text-muted-foreground hover:text-foreground',
                className
            )}
            data-state={active ? 'active' : 'inactive'}
        >
            {children}
        </button>
    );
}

interface TabsContentProps { value: string; children: React.ReactNode; className?: string; }
export function TabsContent({ value, children, className }: TabsContentProps) {
    const ctx = React.useContext(TabsContext);
    if (ctx.value !== value) return null;
    return <div className={cn('focus-visible:outline-none', className)}>{children}</div>;
}
