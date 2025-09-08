import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const PaymentRedirect = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const customerId = searchParams.get('c');
    
    if (customerId) {
      // Redirect to the Supabase edge function
      window.location.href = `https://dkomihipebixlegygnoy.supabase.co/functions/v1/redirect-to-payment-collection?customer_id=${customerId}`;
    } else {
      // Redirect to main site if no customer ID
      window.location.href = '/';
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to payment setup...</p>
      </div>
    </div>
  );
};

export default PaymentRedirect;