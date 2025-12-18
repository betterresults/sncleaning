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
    id: 'domestic-cleaning',
    title: 'Domestic Cleaning',
    icon: Home,
    available: true,
    description: 'Regular home cleaning services'
  },
  {
    id: 'airbnb-cleaning',
    title: 'Airbnb Cleaning',
    icon: Building,
    available: true,
    description: 'Turnaround cleaning for short-term rentals'
  },
  {
    id: 'linen-order',
    title: 'Linen Order',
    icon: Shirt,
    available: true,
    description: 'Order fresh linens for your property'
  },
  {
    id: 'end-of-tenancy',
    title: 'End Of Tenancy Cleaning',
    icon: Users,
    available: isAdminView,
    image: '/lovable-uploads/5ae020cf-fd8c-46fe-8586-933da3fa509c.png',
    description: 'Deep clean for move-out properties'
  },
  {
    id: 'deep-cleaning',
    title: 'Deep Cleaning',
    icon: Droplets,
    available: isAdminView,
    description: 'Thorough cleaning for all areas'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {services.map((service) => {
          const IconComponent = service.icon;
          
          return (
            <Card 
              key={service.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                service.available 
                  ? 'cursor-pointer hover:scale-[1.02] border-2 border-transparent hover:border-primary shadow-md hover:shadow-xl' 
                  : 'cursor-not-allowed opacity-75 shadow-sm'
              }`}
              onClick={() => service.available && handleServiceClick(service.id)}
            >
              {!service.available && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                    Coming Soon
                  </Badge>
                </div>
              )}
              
              <CardContent className="p-5 md:p-6 h-44 md:h-52 flex flex-col items-center justify-center text-center space-y-3 md:space-y-4">
                <div className={`p-4 md:p-5 rounded-full ${service.available ? 'bg-primary/10' : 'bg-muted'}`}>
                  <IconComponent 
                    className={`h-7 w-7 md:h-9 md:w-9 ${service.available ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                </div>
                
                <div className="space-y-1.5 md:space-y-2">
                  <h3 className={`font-semibold text-base md:text-lg ${service.available ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {service.title}
                  </h3>
                  <p className={`text-xs md:text-sm ${service.available ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                    {service.description}
                  </p>
                </div>

                {service.available && (
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
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