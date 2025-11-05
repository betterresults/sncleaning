import { Button } from "@/components/ui/button";
import { Home, Building2, ArrowRight } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

const HomepageServicesSection = () => {
  const handleServiceClick = (service: string) => {
    trackEvent('service_click', {
      location: 'homepage_services',
      service: service
    });
  };

  return (
    <section className="section-padding bg-gradient-to-b from-background to-muted/30">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            Our Services
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Residential Cleaning */}
          <div className="group bg-background rounded-3xl p-8 lg:p-12 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                <Home className="w-10 h-10 text-primary" />
              </div>
              
              <h3 className="text-3xl font-bold font-heading text-foreground">
                Residential Cleaning
              </h3>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Professional home cleaning services tailored to your needs. From regular maintenance to deep cleaning, we keep your home spotless.
              </p>
              
              <div className="pt-4">
                <Button 
                  onClick={() => handleServiceClick('residential')}
                  className="btn-primary group/btn"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Commercial Cleaning */}
          <div className="group bg-background rounded-3xl p-8 lg:p-12 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              
              <h3 className="text-3xl font-bold font-heading text-foreground">
                Commercial Cleaning
              </h3>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Reliable commercial cleaning solutions for offices, retail spaces, and businesses. Flexible scheduling to fit your operations.
              </p>
              
              <div className="pt-4">
                <Button 
                  onClick={() => handleServiceClick('commercial')}
                  className="btn-primary group/btn"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomepageServicesSection;