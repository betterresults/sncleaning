import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Droplets, Home, HardHat, Layers, Building, Waves, Shirt } from 'lucide-react';

interface ServiceSelectionProps {
  onServiceSelect: (serviceType: string) => void;
  isAdminView?: boolean;
}

const getServices = (isAdminView: boolean = false) => [
  {
    id: 'airbnb-cleaning',
    title: 'Airbnb Cleaning',
    icon: Building,
    available: true, // Always available for both admin and customer
    description: 'Turnaround cleaning for short-term rentals'
  },
  {
    id: 'linen-order',
    title: 'Linen Order',
    icon: Shirt,
    available: true, // Always available for both admin and customer
    description: 'Order fresh linens for your property'
  },
  {
    id: 'end-of-tenancy',
    title: 'End Of Tenancy Cleaning',
    icon: Users,
    available: isAdminView, // Available only in admin view
    image: '/lovable-uploads/5ae020cf-fd8c-46fe-8586-933da3fa509c.png',
    description: 'Deep clean for move-out properties'
  },
  {
    id: 'deep-cleaning',
    title: 'Deep Cleaning',
    icon: Droplets,
    available: isAdminView, // Available only in admin view
    description: 'Thorough cleaning for all areas'
  },
  {
    id: 'domestic-cleaning',
    title: 'Domestic Cleaning',
    icon: Home,
    available: isAdminView, // Available only in admin view
    description: 'Regular home cleaning services'
  },
  {
    id: 'after-builders',
    title: 'After Builders Cleaning',
    icon: HardHat,
    available: isAdminView, // Available only in admin view
    description: 'Post-construction cleanup'
  },
  {
    id: 'carpet-cleaning',
    title: 'Carpet Cleaning',
    icon: Layers,
    available: isAdminView, // Available only in admin view
    description: 'Professional carpet deep cleaning'
  },
  {
    id: 'commercial-cleaning',
    title: 'Commercial Cleaning',
    icon: Building,
    available: isAdminView, // Available only in admin view
    description: 'Office and business cleaning'
  }
];

const ServiceSelection = ({ onServiceSelect, isAdminView = false }: ServiceSelectionProps) => {
  const services = getServices(isAdminView);

  const handleServiceClick = (serviceId: string) => {
    // Always call onServiceSelect for any service
    onServiceSelect(serviceId);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service) => {
          const IconComponent = service.icon;
          
          return (
            <Card 
              key={service.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                service.available 
                  ? 'cursor-pointer hover:scale-105 border-2 border-transparent hover:border-[#18A5A5] shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.25)]' 
                  : 'cursor-not-allowed opacity-75 shadow-md'
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