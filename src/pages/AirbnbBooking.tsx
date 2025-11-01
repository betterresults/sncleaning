import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import BookingForm from '../../sn-cleaning-booking-forms-main/src/components/booking/BookingForm';

// Stripe Publishable Key - safe to use in frontend (public key)
const stripePromise = loadStripe('pk_live_FU0wNMP1VPb4fdiK0k8vNvwd000JFB4unW');

const AirbnbBooking = () => {
  return (
    <Elements stripe={stripePromise}>
      <BookingForm />
    </Elements>
  );
};

export default AirbnbBooking;
