import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { SelectionCard } from '@/components/ui/selection-card';
import { BookingData } from '../BookingForm';
import { User, Key, Lock, PackageOpen } from 'lucide-react';

interface ContactStepProps {
  data: BookingData;
  onUpdate: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ContactStep: React.FC<ContactStepProps> = ({ data, onUpdate, onNext, onBack }) => {
  const accessOptions = [
    { value: 'meet', label: "I'll meet you", icon: User },
    { value: 'collect-keys', label: 'Collect keys', icon: Key },
    { value: 'keybox', label: 'Hidden key box', icon: Lock },
    { value: 'other', label: 'Other', icon: PackageOpen }
  ];

  const canContinue = (data.firstName || data.lastName) && data.phone && data.email && data.postcode && data.propertyAccess;

  return (
    <div className="space-y-2">
      <div className="p-2 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Customer Details
        </h2>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
            <Input
              type="text"
              placeholder="First name"
              value={data.firstName}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
              className="border-0 bg-transparent text-lg md:text-xl font-bold text-foreground placeholder:text-muted-foreground focus:ring-0"
            />
          </div>
        </div>
        
        <div>
          <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
            <Input
              type="text"
              placeholder="Last name"
              value={data.lastName}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
              className="border-0 bg-transparent text-lg md:text-xl font-bold text-foreground placeholder:text-muted-foreground focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Phone and Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
            <PhoneInput
              value={data.phone}
              onChange={(value) => onUpdate({ phone: value })}
              className="border-0 bg-transparent text-lg md:text-xl font-bold text-foreground placeholder:text-muted-foreground focus:ring-0"
            />
          </div>
        </div>
        
        <div>
          <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
            <Input
              type="email"
              placeholder="Email address"
              value={data.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              className="border-0 bg-transparent text-lg md:text-xl font-bold text-foreground placeholder:text-muted-foreground focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
          <Input
            type="text"
            placeholder="Enter postcode"
            value={data.postcode}
            onChange={(e) => onUpdate({ postcode: e.target.value })}
            className="border-0 bg-transparent text-lg md:text-xl font-bold text-foreground placeholder:text-muted-foreground focus:ring-0"
          />
        </div>
      </div>

      {/* Property Access */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4 md:mb-6">
          Property Access
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {accessOptions.map((option) => (
            <SelectionCard
              key={option.value}
              value={option.value}
              selectedValue={data.propertyAccess}
              label={option.label}
              icon={option.icon}
              onClick={() => onUpdate({ propertyAccess: option.value })}
              className="h-16 md:h-20"
            />
          ))}
        </div>
      </div>

      {/* Additional Information for Access Options */}
      {(data.propertyAccess === 'collect-keys' || data.propertyAccess === 'keybox' || data.propertyAccess === 'other') && (
        <div>
          <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
            <Textarea
              placeholder={
                data.propertyAccess === 'collect-keys' 
                  ? "Where should we collect the keys? (e.g., building reception, concierge desk)"
                  : data.propertyAccess === 'keybox'
                  ? "Where is the key box located and what's the access code?"
                  : "Please provide any additional access instructions"
              }
              value={data.accessNotes || ''}
              onChange={(e) => onUpdate({ accessNotes: e.target.value })}
              rows={3}
              className="border-0 bg-transparent text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:ring-0 resize-none"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" size="lg" onClick={onBack} className="flex items-center justify-center px-3 sm:px-6">
          <span className="hidden sm:inline">Back</span>
          <span className="sm:hidden text-lg">←</span>
        </Button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className={`flex items-center gap-2 md:gap-3 px-6 md:px-12 py-2 md:py-3 rounded-xl transition-all duration-300 ${
            !canContinue
              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              : 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
          }`}
        >
          <span className="font-medium text-sm">Schedule The Cleaning</span>
        </button>
      </div>
      </div>
    </div>
  );
};

export { ContactStep };