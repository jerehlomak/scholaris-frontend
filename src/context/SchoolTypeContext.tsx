import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API = '/api/v1';

interface SchoolType {
  id: string;
  name: string;
  description: string;
}

interface SchoolTypeContextProps {
  schoolTypes: SchoolType[];
  activeSchoolType: string | null;
  setActiveSchoolType: (type: string | null) => void;
  isLoadingSchoolTypes: boolean;
}

const SchoolTypeContext = createContext<SchoolTypeContextProps | undefined>(undefined);

export const SchoolTypeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [schoolTypes, setSchoolTypes] = useState<SchoolType[]>([]);
  const [activeSchoolType, setActiveSchoolType] = useState<string | null>(null);
  const [isLoadingSchoolTypes, setIsLoadingSchoolTypes] = useState(true);

  useEffect(() => {
    const fetchSchoolTypes = async () => {
      setIsLoadingSchoolTypes(false);
      return; // Disabled as requested by user
    };
    fetchSchoolTypes();
  }, [user]);

  // When activeSchoolType changes, save to localStorage
  useEffect(() => {
    if (activeSchoolType) {
      localStorage.setItem('activeSchoolType', activeSchoolType);
    } else {
      localStorage.removeItem('activeSchoolType');
    }
  }, [activeSchoolType]);

  return (
    <SchoolTypeContext.Provider value={{ schoolTypes, activeSchoolType, setActiveSchoolType, isLoadingSchoolTypes }}>
      {children}
    </SchoolTypeContext.Provider>
  );
};

export const useSchoolType = () => {
  const context = useContext(SchoolTypeContext);
  if (context === undefined) {
    throw new Error('useSchoolType must be used within a SchoolTypeProvider');
  }
  return context;
};
