import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import ProcessSection from "./ProcessSection";
import WhyUsSection from "./WhyUsSection";
import TestimonialsSection from "./TestimonialsSection";
import ChecklistSection from "./ChecklistSection";
import ContentSection from "./ContentSection";
import FAQSection from "./FAQSection";
import ServiceAreasSection from "./ServiceAreasSection";
import GuaranteeSection from "./GuaranteeSection";
import { ServicePageData, StaticSectionData } from "@/types/ServicePageData";

interface ServicePageTemplateProps {
  data: ServicePageData;
  staticData?: StaticSectionData;
}

const ServicePageTemplate = ({ data, staticData }: ServicePageTemplateProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
        <div className="section-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                {data.page_h1}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {data.under_heading}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors">
                  Get Free Quote
                </button>
                <button className="border border-border text-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-muted transition-colors">
                  Call Now: 0123 456 789
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-border/50">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">100%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction Guaranteed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">72h</div>
                  <div className="text-sm text-muted-foreground">Re-clean Guarantee</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">5★</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="/src/assets/professional-cleaner.jpg" 
                alt="Professional cleaning service" 
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic About Section */}
      <section className="section-padding bg-muted/30">
        <div className="section-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {data.page_subheading}
            </h2>
            <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
              <p>{data.page_subheading_description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Static Process Section */}
      <ProcessSection />

      {/* Static Why Us Section */}
      <WhyUsSection />

      {/* Static Testimonials Section */}
      <TestimonialsSection />

      {/* Static Checklist Section */}
      <ChecklistSection />

      {/* Dynamic Content Section */}
      <section className="section-padding bg-muted/20">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {data.page_h2}
            </h2>
            <div className="text-lg text-muted-foreground leading-relaxed mb-8">
              <p>{data.page_h2_paragraph}</p>
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {data.page_h3}
            </h3>
            <div className="text-lg text-muted-foreground leading-relaxed">
              <p>{data.page_h3_paragraph}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic FAQ Section */}
      <section className="section-padding bg-gradient-to-br from-muted/20 to-background">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Got questions? We've got answers about our {data.page_area} cleaning service.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Dynamic FAQs */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">{data.page_question_1}</h3>
              <p className="text-muted-foreground">Our professional answer for this specific question about {data.page_area} cleaning services.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">{data.page_question_2}</h3>
              <p className="text-muted-foreground">Detailed answer explaining our {data.page_area} cleaning process and guarantees.</p>
            </div>

            {/* Static FAQs */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">Do I need to be present during the cleaning?</h3>
              <p className="text-muted-foreground">No, you don't need to be present. Many of our clients prefer to hand over the keys and let us work undisturbed. We're fully insured and bonded for your peace of mind.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">What cleaning products do you use?</h3>
              <p className="text-muted-foreground">We use professional-grade, eco-friendly cleaning products that are safe for all surfaces. All equipment and supplies are provided by us.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-3">How much does a cleaning service cost?</h3>
              <p className="text-muted-foreground">Prices vary based on property size and condition. Contact us for a free, no-obligation quote tailored to your specific needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Service Areas Section */}
      <section className="section-padding bg-muted/20">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
              Areas We <span className="text-primary">Cover</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional cleaning services across {data.page_area}, {data.page_borough}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  "South Hornchurch", "Hornchurch", "Upminster", "Rainham",
                  "Elm Park", "Romford", "Gidea Park", "Harold Wood",
                  "Harold Hill", "Emerson Park", "Cranham", "North Ockendon"
                ].map((area) => {
                  const isCurrentArea = area.toLowerCase().includes(data.page_area.toLowerCase());
                  return (
                    <div 
                      key={area}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isCurrentArea 
                          ? 'bg-primary/10 border-primary/20' 
                          : 'bg-background hover:bg-primary/5'
                      }`}
                    >
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="font-medium text-foreground">{area}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Static Guarantee Section */}
      <GuaranteeSection />
    </div>
  );
};

export default ServicePageTemplate;