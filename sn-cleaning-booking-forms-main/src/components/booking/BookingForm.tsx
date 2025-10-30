import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PropertyStep } from './steps/PropertyStep';

import { LinensStep } from './steps/LinensStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { ContactStep } from './steps/ContactStep';
import { BookingSummary } from './BookingSummary';
import { PaymentStep } from './steps/PaymentStep';
import { Home, Brush, Calendar, User, CreditCard, Package2 } from 'lucide-react';

export interface BookingData {
  // Property details
  propertyType: 'flat' | 'house' | '';
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  
  // Additional rooms (for 2+ bedrooms)
  additionalRooms: {
    toilets: number;
    studyRooms: number;
    utilityRooms: number;
    otherRooms: number;
  };
  
  // Property features
  propertyFeatures: {
    separateKitchen: boolean;
    livingRoom: boolean;
    diningRoom: boolean;
  };
  numberOfFloors: number;
  
  // Service details
  serviceType: 'checkin-checkout' | 'midstay' | 'light' | 'deep' | '';
  alreadyCleaned: boolean | null;
  needsOvenCleaning: boolean | null;
  ovenType: 'single' | 'double' | 'range' | 'convection' | '';
  cleaningProducts: {
    needed: boolean | null;
    equipment: boolean | null;
  };
  equipmentArrangement: 'oneoff' | 'ongoing' | null;
  equipmentStorageConfirmed: boolean;
  
  // Linens
  linensHandling: 'customer-handles' | 'wash-hang' | 'wash-dry' | 'order-linens' | '';
  needsIroning: boolean | null;
  ironingHours: number;
  linenPackages: Record<string, number>;
  extraHours: number;
  
  // Schedule
  selectedDate: Date | null;
  selectedTime: string;
  flexibility: 'not-flexible' | 'flexible-time' | 'flexible-date' | '';
  notes: string;
  
  // Contact
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  houseNumber: string;
  street: string;
  postcode: string;
  city: string;
  propertyAccess: string;
  accessNotes: string;
  
  // Calculations
  estimatedHours: number | null;
  hourlyRate: number;
  totalCost: number;
}

const steps = [
  { id: 1, title: 'Property', key: 'property', icon: <Home className="w-4 h-4" /> },
  { id: 2, title: 'Linens', key: 'linens', icon: <Package2 className="w-4 h-4" /> },
  { id: 3, title: 'Date', key: 'schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 4, title: 'Details', key: 'contact', icon: <User className="w-4 h-4" /> },
  { id: 5, title: 'Summary', key: 'payment', icon: <CreditCard className="w-4 h-4" /> },
];

const BookingForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    toilets: '0',
    additionalRooms: {
      toilets: 0,
      studyRooms: 0,
      utilityRooms: 0,
      otherRooms: 0,
    },
    propertyFeatures: {
      separateKitchen: false,
      livingRoom: false,
      diningRoom: false,
    },
    numberOfFloors: 0,
    serviceType: '',
    alreadyCleaned: null,
    needsOvenCleaning: null,
    ovenType: '',
    cleaningProducts: {
      needed: null, // Start with null to indicate no selection
      equipment: null,
    },
    equipmentArrangement: null,
    equipmentStorageConfirmed: false,
    linensHandling: '',
    needsIroning: null,
    ironingHours: 0,
    linenPackages: {},
    extraHours: 0,
    selectedDate: null,
    selectedTime: '',
    flexibility: '',
    notes: '',
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    houseNumber: '',
    street: '',
    postcode: '',
    city: '',
    propertyAccess: '',
    accessNotes: '',
    estimatedHours: null, // Start with null instead of 0
    hourlyRate: 25,
    totalCost: 0,
  });

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => {
      const newData = { ...prev, ...updates };
      
      // Recalculate costs when relevant data changes
      if (updates.estimatedHours !== undefined || updates.extraHours !== undefined) {
        const estimatedHours = updates.estimatedHours ?? newData.estimatedHours ?? 0;
        const extraHours = updates.extraHours ?? newData.extraHours;
        const totalHours = estimatedHours + extraHours;
        newData.totalCost = totalHours * newData.hourlyRate;
      }
      
      return newData;
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PropertyStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <LinensStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <ScheduleStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <ContactStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <PaymentStep
            data={bookingData}
            onBack={prevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-6">
            Airbnb Cleaning Booking Form
          </h1>
          
          {/* Step Navigation */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between bg-gray-100 rounded-xl p-2 gap-2">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;
                const canNavigate = isCompleted || stepNumber <= currentStep;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => canNavigate && setCurrentStep(stepNumber)}
                    disabled={!canNavigate}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 flex-1 ${
                      isActive 
                        ? 'bg-primary text-white shadow-md' 
                        : isCompleted
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'text-gray-400 hover:text-gray-600'
                    } ${canNavigate ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                      isActive 
                        ? 'bg-white/20' 
                        : isCompleted
                        ? 'bg-primary/20'
                        : 'bg-gray-200'
                    }`}>
                      {step.icon}
                    </div>
                    <span className="font-medium text-sm hidden sm:block">{step.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="p-8 shadow-sm bg-white">
              {renderStep()}
            </Card>
          </div>
          
          {/* Summary Section - Takes 1 column, always visible */}
          <div className="lg:col-span-1">
            <BookingSummary data={bookingData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingForm;