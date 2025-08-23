import React from 'react';
import ModernAirbnbBookingForm from './ModernAirbnbBookingForm';

interface AirbnbBookingFormProps {
  customerData: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  onBookingCreated: () => void;
}

const AirbnbBookingForm: React.FC<AirbnbBookingFormProps> = ({ customerData, onBookingCreated }) => {
  // Use the new modern form component
  return (
    <ModernAirbnbBookingForm 
      customerData={customerData} 
      onBookingCreated={onBookingCreated} 
    />
  );
};

export default AirbnbBookingForm;