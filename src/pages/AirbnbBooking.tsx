import { AirbnbBookingForm } from '@/features/booking';
import { ShellPage } from '@/layouts/shell';

const AirbnbBooking = () => {
  return (
    <ShellPage width="wide">
      <AirbnbBookingForm />
    </ShellPage>
  );
};

export default AirbnbBooking;
