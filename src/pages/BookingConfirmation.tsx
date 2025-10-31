import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';

interface BookingDetails {
  id: number;
  date_time: string;
  address: string;
  postcode: string;
  service_type: string;
  total_cost: number;
  customer: number;
}

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const bookingId = location.state?.bookingId;

  useEffect(() => {
    if (!bookingId) {
      // Show demo data if accessed directly
      setBooking({
        id: 12345,
        date_time: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        address: '123 Demo Street, London',
        postcode: 'SW1A 1AA',
        service_type: 'end-of-tenancy',
        total_cost: 250.00,
        customer: 1
      });
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, date_time, address, postcode, service_type, total_cost, customer')
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]">
        <Loader2 className="h-12 w-12 animate-spin text-[#185166]" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]">
        <div className="text-center">
          <p className="text-xl text-[#185166] mb-4">Booking not found</p>
          <Button onClick={() => navigate('/airbnb')}>Back to Booking</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <CheckCircle className="h-24 w-24 text-green-500 relative" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#185166] text-center mb-3">
          Booking Confirmed!
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Thank you! Your booking has been successfully created.
        </p>

        {/* Booking Details */}
        <div className="space-y-6 bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-[#185166] mb-4">Booking Details</h2>
          
          <div className="flex items-start gap-4">
            <Calendar className="h-6 w-6 text-[#185166] mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(booking.date_time).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-base text-gray-700">
                {new Date(booking.date_time).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <MapPin className="h-6 w-6 text-[#185166] mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-lg font-semibold text-gray-900">
                {booking.address}
                <br />
                {booking.postcode}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Service Type</span>
              <span className="font-semibold text-gray-900 capitalize">
                {booking.service_type.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-600">Total Cost</span>
              <span className="text-2xl font-bold text-[#185166]">
                £{booking.total_cost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-[#185166] mb-2">What's Next?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• You'll receive a confirmation email shortly</li>
            <li>• Create an account to manage your bookings</li>
            <li>• We'll send you a reminder before your appointment</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate('/auth')}
            className="flex-1 h-12 text-base bg-[#185166] hover:bg-[#185166]/90"
          >
            Log In to Your Account
          </Button>
          <Button
            onClick={() => navigate('/airbnb')}
            variant="outline"
            className="flex-1 h-12 text-base"
          >
            Book Another Service
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
