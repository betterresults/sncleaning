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
    // Store selected service and redirect to auth/signup with service info
    sessionStorage.setItem('selectedService', serviceType);
    sessionStorage.setItem('bookingPostcode', postcode);
    sessionStorage.setItem('bookingEmail', email);
    
    // Redirect to auth page with message to sign up/login
    navigate(`/auth?service=${serviceType}&postcode=${postcode}&email=${email}`);
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
          Back to Home
        </Button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-[#185166] mb-4">
              Choose Your Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Select the cleaning service you'd like to book
            </p>
            {postcode && (
              <p className="text-sm text-muted-foreground mt-2">
                Service area: <span className="font-semibold">{postcode}</span>
              </p>
            )}
          </div>

          <ServiceSelection onServiceSelect={handleServiceSelect} isAdminView={false} />
        </div>
      </div>
    </div>
  );
};

export default PublicServiceSelection;
