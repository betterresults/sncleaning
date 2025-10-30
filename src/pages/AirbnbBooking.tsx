import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import BookingForm from '../../sn-cleaning-booking-forms-main/src/components/booking/BookingForm';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_live_51QMZh8P9b6TDZfxjy5mjZcNXMDqjjQKi8D0VhHZBQUcQ8DPZQc9w0g8N4gzZGU9PtzTbYCKR0zX9Fa1I5IFOmTLB00rDzCR0rI');

const AirbnbBooking = () => {
  return (
    <Elements stripe={stripePromise}>
      <BookingForm />
    </Elements>
  );
};

export default AirbnbBooking;
