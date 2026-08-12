import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || '/api/v1';
import { Check, ChevronDown, Monitor } from 'lucide-react';

export interface ScopeOption {
  id: string;
  name: string;
  type: 'GLOBAL' | 'SECTION' | 'CLASS';
  value: string; // The raw category name or class ID
}

interface ScopeSelectorProps {
  value: string | null;
  type: 'GLOBAL' | 'SECTION' | 'CLASS';
  onChange: (value: string | null, type: 'GLOBAL' | 'SECTION' | 'CLASS') => void;
  label?: string;
}

export function ScopeSelector({ value, type, onChange, label = "Configuration Scope" }: ScopeSelectorProps) {
  const [options, setOptions] = useState<ScopeOption[]>([{ id: 'GLOBAL', name: 'Global (All Sections)', type: 'GLOBAL', value: 'ALL' }]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchScopes = async () => {
      try {
        const [levelsRes, classesRes] = await Promise.all([
          axios.get(`${API}/school-settings/class-levels`, { withCredentials: true }),
          axios.get(`${API}/classes/all`, { withCredentials: true })
        ]);

        const uniqueCats = Array.from(new Set(levelsRes.data.levels.map((l: any) => l.category).filter(Boolean))) as string[];
        const sectionOpts: ScopeOption[] = uniqueCats.map(c => ({
          id: `SEC_${c}`,
          name: `${c} (Section)`,
          type: 'SECTION',
          value: c
        }));

        const classOpts: ScopeOption[] = (classesRes.data.classes || []).map((c: any) => ({
          id: `CLS_${c.id}`,
          name: `${c.name} (Class Override)`,
          type: 'CLASS',
          value: c.id
        }));

        setOptions([
          { id: 'GLOBAL', name: 'Global (All Sections)', type: 'GLOBAL', value: 'ALL' },
          ...sectionOpts,
          ...classOpts
        ]);
      } catch (err) {
        console.error("Failed to load scopes", err);
      }
    };
    fetchScopes();
  }, []);

  const selectedOption = options.find(o => o.type === type && o.value === value) || options[0];

  return (
    <div className="relative mb-6">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <div 
        className="w-full md:w-96 flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Monitor size={18} className="text-blue-600 dark:text-blue-400" />
          <span className="text-slate-800 dark:text-slate-100 font-medium">{selectedOption?.name}</span>
        </div>
        <ChevronDown size={18} className="text-slate-500" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full md:w-96 max-h-80 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
          {['GLOBAL', 'SECTION', 'CLASS'].map((groupType) => {
            const groupOptions = options.filter(o => o.type === groupType);
            if (groupOptions.length === 0) return null;
            return (
              <div key={groupType} className="py-2">
                <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                  {groupType}
                </div>
                {groupOptions.map(opt => (
                  <div
                    key={opt.id}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedOption?.id === opt.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => {
                      onChange(opt.value, opt.type);
                      setIsOpen(false);
                    }}
                  >
                    <span className={`text-sm ${selectedOption?.id === opt.id ? 'text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                      {opt.name}
                    </span>
                    {selectedOption?.id === opt.id && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
