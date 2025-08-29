import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, Copy, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Coming Soon Banner */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Construction className="h-16 w-16 text-orange-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#185166]">Coming Soon!</h2>
              <p className="text-lg text-gray-700">
                The booking forms in our app are currently under development.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Solution */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-[#185166]">In the meantime, here's how to book your Airbnb cleaning:</h3>
              <p className="text-gray-600">
                You can easily create new bookings by duplicating from your completed ones
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-3 p-4">
                <div className="w-12 h-12 rounded-full bg-[#18A5A5] flex items-center justify-center">
                  <span className="text-white font-bold">1</span>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#185166]">Go to Completed Bookings</p>
                  <p className="text-sm text-gray-600">Find your completed cleaning bookings</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 p-4">
                <div className="w-12 h-12 rounded-full bg-[#18A5A5] flex items-center justify-center">
                  <Copy className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#185166]">Duplicate Booking</p>
                  <p className="text-sm text-gray-600">Click the duplicate button on any booking</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 p-4">
                <div className="w-12 h-12 rounded-full bg-[#18A5A5] flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-[#185166]">Choose New Date</p>
                  <p className="text-sm text-gray-600">Select your preferred date and time</p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button 
                onClick={() => navigate('/customer-completed-bookings')}
                className="bg-[#18A5A5] hover:bg-[#185166] text-white px-8 py-3 text-lg"
              >
                Go to Completed Bookings
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="border-slate-200">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Need help with booking? Contact us directly:
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <span className="font-medium text-[#185166]">📞 Phone: [Your Phone]</span>
              <span className="font-medium text-[#185166]">📧 Email: [Your Email]</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AirbnbBookingForm;