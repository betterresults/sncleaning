import { EndOfTenancyBookingForm } from '@/features/booking';
import { ShellPage } from '@/layouts/shell';

const EndOfTenancyBooking = () => {
  return (
    <ShellPage width="wide">
      <EndOfTenancyBookingForm />
    </ShellPage>
  );
};

export default EndOfTenancyBooking;
