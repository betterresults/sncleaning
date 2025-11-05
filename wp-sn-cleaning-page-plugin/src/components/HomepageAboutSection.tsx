import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Building, Sparkles, Calendar } from "lucide-react";
import professionalCleaner from "@/assets/professional-cleaner.jpg";
import { trackEvent } from "@/utils/analytics";

const HomepageAboutSection = () => {
  const services = [
    {
      icon: Home,
      title: "Domestic Cleaning",
      description: "Regular house cleaning, deep cleaning, and maintenance services for your home."
    },
    {
      icon: Building,
      title: "End Of Tenancy Cleaning",
      description: "Comprehensive cleaning service to ensure you get your full deposit back."
    },
    {
      icon: Sparkles,
      title: "Specialized Cleaning",
      description: "Carpet cleaning, upholstery cleaning, and other specialized services."
    },
    {
      icon: Calendar,
      title: "Commercial Services",
      description: "Regular office cleaning, retail cleaning, and business maintenance."
    }
  ];

  const handleQuoteClick = () => {
    trackEvent('get_quote_click', {
      location: 'homepage_about_section'
    });
  };

  return (
    <section className="section-padding bg-background">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            More About Our Professional Cleaning Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover our comprehensive range of cleaning services designed to meet all your 
            residential and commercial needs with professional excellence.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Services Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {services.map(({ icon: Icon, title, description }, idx) => (
              <div key={idx} className="bg-gradient-surface rounded-2xl p-6 space-y-4 border border-border/50">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Image and CTA */}
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl">
              <img 
                src={professionalCleaner} 
                alt="Professional cleaner in action" 
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Professional Excellence</h3>
                <p className="text-white/90">Trained, insured, and dedicated to delivering outstanding results.</p>
              </div>
            </div>

            <div className="bg-gradient-surface rounded-2xl p-8 border border-border/50">
              <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Get an instant quote for your cleaning needs. No hidden fees, transparent pricing, 
                and satisfaction guaranteed.
              </p>
              <Button 
                onClick={handleQuoteClick}
                className="btn-hero w-full group"
              >
                Get Instant Quote
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomepageAboutSection;