import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Shield, Star, MapPin, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-kitchen.jpg";
import { trackEvent } from "@/utils/analytics";

const HomepageHeroSection = () => {
  const [postcode, setPostcode] = useState("");

  const handleGetQuote = () => {
    trackEvent('get_quote_click', {
      location: 'homepage_hero',
      postcode: postcode || 'not_provided'
    });
    
    const bookingPageUrl = '/booking';
    if (postcode) {
      window.location.href = bookingPageUrl + '?postcode=' + encodeURIComponent(postcode);
    } else {
      window.location.href = bookingPageUrl;
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(28, 60, 80, 0.9), rgba(24, 81, 102, 0.85)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-accent/20 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary-light/20 rounded-full blur-md animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="section-container relative z-20 section-padding">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Hero Content */}
          <div className="lg:col-span-3 text-white space-y-8 animate-slide-up">
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-heading leading-tight text-center lg:text-left">
                <span className="block">Best Cleaners</span>
                <span className="block">In Your <span className="text-primary">Area</span></span>
              </h1>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-accent leading-relaxed text-center lg:text-left">
                Professional Cleaning Services
              </h2>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
                Experience reliable & professional cleaning services. 
                <span className="font-semibold text-accent"> Book online today</span> and enjoy a spotless home or office.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-3 lg:gap-4 pt-4 max-w-md lg:max-w-none">
              <div className="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400 flex-shrink-0" />
                <span className="font-semibold text-xs lg:text-sm">Fully Insured</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                <Star className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400 flex-shrink-0" />
                <span className="font-semibold text-xs lg:text-sm">5-Star Rated</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-400 flex-shrink-0" />
                <span className="font-semibold text-xs lg:text-sm">Same-Day Service</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 flex-shrink-0" />
                <span className="font-semibold text-xs lg:text-sm">Local Experts</span>
              </div>
            </div>
          </div>

          {/* Quote Form */}
          <div className="lg:col-span-2 animate-fade-in-delayed">
            {/* Desktop Form */}
            <div className="hidden lg:block card-glass p-6 lg:p-8 max-w-md mx-auto lg:ml-auto lg:mr-0">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold font-heading text-foreground mb-3">
                  Get Your Instant Quote
                </h3>
              </div>

              <div className="space-y-4">
                {/* Desktop input with icon */}
                <div className="flex items-center bg-background rounded-xl border-2 border-input shadow-sm px-4 py-3">
                  <MapPin className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                  <Input
                    id="postcode-desktop"
                    type="text"
                    placeholder="Enter a postcode here"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="border-0 bg-transparent text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 font-medium"
                  />
                </div>
                
                {/* Button underneath */}
                <Button
                  onClick={handleGetQuote}
                  className="btn-hero w-full h-14 text-lg"
                >
                  Get A Quote
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Mobile Form */}
            <div className="lg:hidden w-full max-w-2xl mx-auto">
              <div className="bg-background rounded-2xl p-3 shadow-xl border border-input">
                <div className="flex items-center px-4 py-3">
                  <MapPin className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                  <Input
                    id="postcode-mobile"
                    type="text"
                    placeholder="Enter a postcode here"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="border-0 bg-transparent text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 font-medium"
                  />
                </div>
                <Button
                  onClick={handleGetQuote}
                  className="btn-hero w-full h-12 text-base mt-2"
                >
                  Get A Quote
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomepageHeroSection;