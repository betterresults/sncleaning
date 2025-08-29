import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Droplets, Home, HardHat, Layers, Building, Waves } from 'lucide-react';

interface ServiceSelectionProps {
  onServiceSelect: (serviceType: string) => void;
}

const services = [
  {
    id: 'airbnb-cleaning',
    title: 'Airbnb Cleaning',
    icon: Building,
    available: false,
    description: 'Turnaround cleaning for short-term rentals'
  },
  {
    id: 'end-of-tenancy',
    title: 'End Of Tenancy Cleaning',
    icon: Users,
    available: false,
    image: '/lovable-uploads/5ae020cf-fd8c-46fe-8586-933da3fa509c.png', // Using uploaded image as reference
    description: 'Deep clean for move-out properties'
  },
  {
    id: 'deep-cleaning',
    title: 'Deep Cleaning',
    icon: Droplets,
    available: false,
    description: 'Thorough cleaning for all areas'
  },
  {
    id: 'domestic-cleaning',
    title: 'Domestic Cleaning',
    icon: Home,
    available: false,
    description: 'Regular home cleaning services'
  },
  {
    id: 'after-builders',
    title: 'After Builders Cleaning',
    icon: HardHat,
    available: false,
    description: 'Post-construction cleanup'
  },
  {
    id: 'carpet-cleaning',
    title: 'Carpet Cleaning',
    icon: Layers,
    available: false,
    description: 'Professional carpet deep cleaning'
  },
  {
    id: 'commercial-cleaning',
    title: 'Commercial Cleaning',
    icon: Building,
    available: false,
    description: 'Office and business cleaning'
  }
];

const ServiceSelection = ({ onServiceSelect }: ServiceSelectionProps) => {
  const navigate = useNavigate();

  const handleServiceClick = (serviceId: string) => {
    if (serviceId === 'airbnb-cleaning') {
      navigate('/customer/airbnb-form');
    } else {
      onServiceSelect(serviceId);
    }
  };

  return (
    <div className="space-y-8">
      {/* Development Notice - Moved to Top */}
      <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
        <h3 className="text-lg font-semibold text-[#185166]">
          📋 Booking forms in our app are currently under development
        </h3>
        <p className="text-gray-600">
          While we're perfecting the booking experience, you can easily create new bookings by duplicating from your completed ones in the <strong>Completed Bookings</strong> tab.
        </p>
        <div className="text-sm text-gray-500">
          Simply find a completed booking, click duplicate, and choose your new date and time!
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#185166] mb-4">
          Choose the service you would like to book
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service) => {
          const IconComponent = service.icon;
          
          return (
            <Card 
              key={service.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                service.available 
                  ? 'cursor-pointer hover:scale-105 border-2 border-transparent hover:border-[#18A5A5]' 
                  : 'cursor-not-allowed opacity-75'
              }`}
              onClick={() => service.available && handleServiceClick(service.id)}
            >
              {!service.available && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                    Coming Soon
                  </Badge>
                </div>
              )}
              
              <CardContent className="p-6 h-48 flex flex-col items-center justify-center text-center space-y-4">
                <div className={`p-4 rounded-full ${service.available ? 'bg-[#18A5A5]/10' : 'bg-gray-100'}`}>
                  <IconComponent 
                    className={`h-8 w-8 ${service.available ? 'text-[#18A5A5]' : 'text-gray-400'}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className={`font-semibold text-lg ${service.available ? 'text-[#185166]' : 'text-gray-500'}`}>
                    {service.title}
                  </h3>
                  <p className={`text-sm ${service.available ? 'text-gray-600' : 'text-gray-400'}`}>
                    {service.description}
                  </p>
                </div>

                {service.available && (
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18A5A5]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelection;