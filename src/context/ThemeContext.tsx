import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemePlacement = 'ltl' | 'rtl';
type GlobalTheme = 'light' | 'dark'; // New
type SidebarBg = 'dark' | 'red' | 'teal' | 'green' | 'blue' | 'light';
type HeaderBg = 'dark' | 'red' | 'teal' | 'green' | 'blue' | 'light';
type ActiveItemBg = 'red' | 'pink' | 'teal' | 'blue' | 'yellow' | 'orange' | 'indigo' | 'navy' | 'magenta' | 'rust' | 'forest' | 'purple';
type TextColor = 'white' | 'dark' | 'gray';

interface ThemeContextType {
    globalTheme: GlobalTheme;
    setGlobalTheme: (val: GlobalTheme) => void;
    themePlacement: ThemePlacement;
    setThemePlacement: (val: ThemePlacement) => void;
    sidebarBg: SidebarBg;
    setSidebarBg: (val: SidebarBg) => void;
    headerBg: HeaderBg;
    setHeaderBg: (val: HeaderBg) => void;
    activeItemBg: ActiveItemBg;
    setActiveItemBg: (val: ActiveItemBg) => void;
    sidebarText: TextColor;
    setSidebarText: (val: TextColor) => void;
    headerText: TextColor;
    setHeaderText: (val: TextColor) => void;
    language: string;
    setLanguage: (val: string) => void;
}

import i18n from '../i18n';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Read from localStorage or use defaults
    const [globalTheme, setGlobalTheme] = useState<GlobalTheme>(() =>
        (localStorage.getItem('globalTheme') as GlobalTheme) || 'light'
    );
    const [themePlacement, setThemePlacement] = useState<ThemePlacement>(() =>
        (localStorage.getItem('themePlacement') as ThemePlacement) || 'ltl'
    );
    const [sidebarBg, setSidebarBg] = useState<SidebarBg>(() =>
        (localStorage.getItem('sidebarBg') as SidebarBg) || 'light' // Default to light/white sidebar
    );
    const [headerBg, setHeaderBg] = useState<HeaderBg>(() =>
        (localStorage.getItem('headerBg') as HeaderBg) || 'light'
    );
    const [activeItemBg, setActiveItemBg] = useState<ActiveItemBg>(() =>
        (localStorage.getItem('activeItemBg') as ActiveItemBg) || 'indigo'
    );
    const [sidebarText, setSidebarText] = useState<TextColor>(() =>
        (localStorage.getItem('sidebarText') as TextColor) || 'dark'
    );
    const [headerText, setHeaderText] = useState<TextColor>(() =>
        (localStorage.getItem('headerText') as TextColor) || 'dark'
    );
    const [language, setLanguage] = useState<string>(() =>
        localStorage.getItem('language') || 'en'
    );

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('globalTheme', globalTheme);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(globalTheme);
    }, [globalTheme]);

    useEffect(() => {
        localStorage.setItem('themePlacement', themePlacement);
        document.documentElement.dir = themePlacement === 'rtl' ? 'rtl' : 'ltr';
    }, [themePlacement]);

    useEffect(() => localStorage.setItem('sidebarBg', sidebarBg), [sidebarBg]);
    useEffect(() => localStorage.setItem('headerBg', headerBg), [headerBg]);
    useEffect(() => localStorage.setItem('sidebarText', sidebarText), [sidebarText]);
    useEffect(() => localStorage.setItem('headerText', headerText), [headerText]);
    useEffect(() => localStorage.setItem('activeItemBg', activeItemBg), [activeItemBg]);
    useEffect(() => {
        localStorage.setItem('language', language);
        i18n.changeLanguage(language);
    }, [language]);

    return (
        <ThemeContext.Provider value={{
            globalTheme, setGlobalTheme,
            themePlacement, setThemePlacement,
            sidebarBg, setSidebarBg,
            headerBg, setHeaderBg,
            sidebarText, setSidebarText,
            headerText, setHeaderText,
            activeItemBg, setActiveItemBg,
            language, setLanguage
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
