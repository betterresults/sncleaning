import { DomesticBookingForm } from '@/features/booking';
import { ShellPage } from '@/layouts/shell';

const DomesticBooking = () => {
  return (
    <ShellPage width="wide">
      <DomesticBookingForm />
    </ShellPage>
  );
};

export default DomesticBooking;
