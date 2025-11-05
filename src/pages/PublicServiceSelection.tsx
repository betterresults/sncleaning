import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ServiceSelection from '@/components/booking/ServiceSelection';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PublicServiceSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [postcode, setPostcode] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    // Get postcode and email from URL parameters
    const postcodeParam = searchParams.get('postcode');
    const emailParam = searchParams.get('email');
    
    if (postcodeParam) setPostcode(postcodeParam);
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleServiceSelect = (serviceType: string) => {
    // Store selected service and booking details
    sessionStorage.setItem('selectedService', serviceType);
    sessionStorage.setItem('bookingPostcode', postcode);
    sessionStorage.setItem('bookingEmail', email);
    
    // For public booking forms (Airbnb, Linen), redirect directly to the form
    if (serviceType === 'airbnb-cleaning') {
      navigate(`/airbnb?postcode=${encodeURIComponent(postcode)}&email=${encodeURIComponent(email)}`);
      return;
    }
    
    if (serviceType === 'linen-order') {
      navigate(`/linen-order?postcode=${encodeURIComponent(postcode)}&email=${encodeURIComponent(email)}`);
      return;
    }
    
    // For other services, redirect to auth page to sign up/login first
    navigate(`/auth?service=${serviceType}&postcode=${encodeURIComponent(postcode)}&email=${encodeURIComponent(email)}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="outline"
          onClick={handleBackToHome}
          className="mb-6 flex items-center gap-2 text-[#185166] border-[#185166] hover:bg-[#185166] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold text-[#185166] mb-2">
              {postcode ? `Services We Offer in ${postcode}` : 'Choose Your Service'}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Select the cleaning service you need
            </p>
          </div>

          <ServiceSelection onServiceSelect={handleServiceSelect} isAdminView={false} />
        </div>
      </div>
    </div>
  );
};

export default PublicServiceSelection;
