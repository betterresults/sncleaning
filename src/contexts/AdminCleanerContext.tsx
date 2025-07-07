import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdminCleanerContextType {
  selectedCleanerId: number | null;
  setSelectedCleanerId: (id: number | null) => void;
}

const AdminCleanerContext = createContext<AdminCleanerContextType | undefined>(undefined);

export const useAdminCleaner = () => {
  const context = useContext(AdminCleanerContext);
  if (context === undefined) {
    throw new Error('useAdminCleaner must be used within an AdminCleanerProvider');
  }
  return context;
};

interface AdminCleanerProviderProps {
  children: ReactNode;
}

export const AdminCleanerProvider: React.FC<AdminCleanerProviderProps> = ({ children }) => {
  const [selectedCleanerId, setSelectedCleanerId] = useState<number | null>(null);

  return (
    <AdminCleanerContext.Provider value={{ selectedCleanerId, setSelectedCleanerId }}>
      {children}
    </AdminCleanerContext.Provider>
  );
};