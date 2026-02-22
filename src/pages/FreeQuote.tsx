import FreeQuoteForm from '@/components/landing/FreeQuoteForm';
import TrustBadges from '@/components/landing/TrustBadges';
import LandingTestimonials from '@/components/landing/LandingTestimonials';

const FreeQuote = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafa] via-white to-[#e0f2f1]">
      {/* Lead capture section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#185166] mb-3">
            Get Your Free Cleaning Quote...
            <br />
            <span className="text-[#18A5A5]">in under 2 Minutes</span>
          </h1>

          <p className="text-gray-600 mb-8">
            Plus Get <span className="font-bold text-[#185166]">10% Off</span> Your First Cleaning If You Checkout Using The Hassle Free Portal
          </p>

          <div className="flex justify-center">
            <FreeQuoteForm />
          </div>

          <TrustBadges />
        </div>
      </section>

      {/* Testimonials */}
      <LandingTestimonials />
    </div>
  );
};

export default FreeQuote;
