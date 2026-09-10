import { EndOfTenancyBookingForm } from '@/features/booking';
import { ShellPage } from '@/layouts/shell';

const DeepCleaningBooking = () => {
  return (
    <ShellPage width="wide">
      <EndOfTenancyBookingForm variant="deep-cleaning" />
    </ShellPage>
  );
};

export default DeepCleaningBooking;
