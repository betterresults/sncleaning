import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdminCustomerContextType {
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
}

const AdminCustomerContext = createContext<AdminCustomerContextType | undefined>(undefined);

export const useAdminCustomer = () => {
  const context = useContext(AdminCustomerContext);
  if (context === undefined) {
    throw new Error('useAdminCustomer must be used within an AdminCustomerProvider');
  }
  return context;
};

interface AdminCustomerProviderProps {
  children: ReactNode;
}

export const AdminCustomerProvider: React.FC<AdminCustomerProviderProps> = ({ children }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  return (
    <AdminCustomerContext.Provider value={{ selectedCustomerId, setSelectedCustomerId }}>
      {children}
    </AdminCustomerContext.Provider>
  );
};