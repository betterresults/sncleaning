import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw } from 'lucide-react';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const errorMessage = searchParams.get('error') || 'Your payment could not be processed.';
  const bookingId = searchParams.get('bookingId');

  const handleTryAgain = () => {
    // Navigate back to the booking form - user will need to restart the process
    // We could preserve form data in sessionStorage for a better experience
    const returnPath = sessionStorage.getItem('booking_form_path') || '/airbnb';
    navigate(returnPath);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
            <XCircle className="h-20 w-20 text-red-500 relative" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Payment Failed
        </h1>
        
        <p className="text-gray-600 mb-6">
          {errorMessage}
        </p>

        {bookingId && (
          <p className="text-sm text-gray-500 mb-6">
            Booking reference: #{bookingId}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleTryAgain}
            className="w-full h-12 bg-[#185166] hover:bg-[#185166]/90"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full h-12"
          >
            Back to Home
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          If you continue to experience issues, please contact our support team.
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
