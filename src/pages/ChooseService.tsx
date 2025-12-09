import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Home, Users, Droplets, HardHat, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const services = [
  {
    id: 'airbnb-cleaning',
    title: 'Airbnb Cleaning',
    icon: Building,
    available: true,
    description: 'Turnaround cleaning for short-term rentals'
  },
  {
    id: 'domestic-cleaning',
    title: 'Domestic Cleaning',
    icon: Home,
    available: true,
    description: 'Regular home cleaning services'
  },
  {
    id: 'end-of-tenancy',
    title: 'End Of Tenancy Cleaning',
    icon: Users,
    available: false,
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

const ChooseService = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postcode = searchParams.get('postcode') || '';
  const email = searchParams.get('email') || '';

  const handleServiceSelect = (serviceId: string) => {
    sessionStorage.setItem('selectedService', serviceId);
    sessionStorage.setItem('bookingPostcode', postcode);
    sessionStorage.setItem('bookingEmail', email);

    if (serviceId === 'airbnb-cleaning') {
      navigate(`/airbnb?postcode=${encodeURIComponent(postcode)}&email=${encodeURIComponent(email)}`);
      return;
    }

    if (serviceId === 'domestic-cleaning') {
      navigate(`/domestic?postcode=${encodeURIComponent(postcode)}&email=${encodeURIComponent(email)}`);
      return;
    }

    // For other services, redirect to auth page
    navigate(`/auth?service=${serviceId}&postcode=${encodeURIComponent(postcode)}&email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold text-[#185166] mb-2">
              {postcode ? `Services We Offer in ${postcode}` : 'Choose Your Service'}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Select the cleaning service you need
            </p>
          </div>

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
                  onClick={() => service.available && handleServiceSelect(service.id)}
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
      </div>
    </div>
  );
};

export default ChooseService;
