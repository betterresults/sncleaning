import { Phone, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/utils/analytics";

const CallToActionSection = () => {
  const handleGetQuote = () => {
    trackEvent('cta_get_quote_click', { location: 'cta_section' });
    // Navigate to quote page
    window.location.href = '/quote';
  };

  const handleCallNow = () => {
    trackEvent('cta_call_click', { location: 'cta_section' });
    window.location.href = 'tel:+442012345678';
  };

  const benefits = [
    "Free, no-obligation quotes",
    "Same-day booking available", 
    "100% satisfaction guaranteed",
    "Fully insured & bonded",
    "Professional team",
    "Eco-friendly products"
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-primary via-primary-dark to-primary/80 text-white relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-to-br from-white/20 to-primary-glow/30 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-primary-glow/40 to-white/15 rounded-full blur-lg animate-float delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-white/25 to-primary-glow/20 rounded-full blur-md animate-float delay-500"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/20 to-transparent"></div>
      </div>

      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <div className="mb-12">
            <h2 className="text-4xl lg:text-6xl font-bold font-heading mb-6">
              Ready for a <span className="bg-gradient-to-r from-white to-primary-glow bg-clip-text text-transparent">Spotless</span> Clean?
            </h2>
            <p className="text-xl lg:text-2xl text-white/95 max-w-3xl mx-auto leading-relaxed">
              Join thousands of satisfied customers across London & Essex. Get your instant quote today and experience the difference professional cleaning makes.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl p-5 hover:bg-white/25 hover:scale-105 transition-all duration-300 border border-white/20"
              >
                <CheckCircle className="w-5 h-5 text-primary-glow flex-shrink-0" />
                <span className="text-white font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Enhanced CTA Button */}
          <div className="mb-16 flex justify-center">
            <Button 
              onClick={handleGetQuote}
              size="lg"
              className="bg-gradient-to-r from-white via-primary-glow/10 to-white text-primary hover:from-primary-glow hover:via-white hover:to-primary-glow hover:text-primary-dark text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-3xl font-bold shadow-2xl hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transform hover:scale-110 transition-all duration-500 flex items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-md sm:max-w-none border-2 border-white/20 hover:border-primary-glow/50"
            >
              <span className="text-xl sm:text-2xl font-extrabold">Get Instant Quote</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-white/90">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary-glow" />
              <span className="font-medium">Response within 30 minutes</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-primary-glow" />
              <span className="font-medium">No hidden fees</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-primary-glow" />
              <span className="font-medium">24/7 customer support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;