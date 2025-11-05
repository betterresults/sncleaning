import { Button } from "@/components/ui/button";
import { Search, FileText, Calendar, ArrowRight } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

const HomepageBookingSection = () => {
  const steps = [
    {
      icon: Search,
      title: "Choose Service",
      description: "Select your cleaning requirements"
    },
    {
      icon: FileText,
      title: "Fill the Form",
      description: "Provide your details and preferences"
    },
    {
      icon: Calendar,
      title: "Book Online",
      description: "Select your preferred date and time"
    }
  ];

  const handleBookNow = () => {
    trackEvent('book_now_click', {
      location: 'homepage_booking_section'
    });
  };

  return (
    <section className="section-padding bg-gradient-to-b from-background to-muted/30">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            Simple Booking Process
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Getting your space cleaned is easier than ever
          </p>
        </div>

        {/* Process Flow Container */}
        <div className="bg-background rounded-3xl border border-border/50 shadow-xl p-8 lg:p-12 mb-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {steps.map(({ icon: Icon, title, description }, idx) => (
              <div key={idx} className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                {/* Step */}
                <div className="text-center group">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-4 border-primary rounded-full flex items-center justify-center text-sm font-bold text-primary shadow-lg">
                      {idx + 1}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
                  <p className="text-muted-foreground max-w-xs">{description}</p>
                </div>

                {/* Arrow - only show between steps, not after the last one */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block">
                    <ArrowRight className="w-8 h-8 text-primary/60" />
                  </div>
                )}
                
                {/* Mobile arrow - vertical */}
                {idx < steps.length - 1 && (
                  <div className="md:hidden rotate-90">
                    <ArrowRight className="w-6 h-6 text-primary/60" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Large CTA Button */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleBookNow}
              className="btn-hero text-xl sm:text-2xl px-8 sm:px-12 py-4 sm:py-6 rounded-2xl shadow-2xl hover:shadow-primary/25 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              Get Quote & Book Online
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Free instant quotes • No hidden fees • Quick response
          </p>
        </div>
      </div>
    </section>
  );
};

export default HomepageBookingSection;