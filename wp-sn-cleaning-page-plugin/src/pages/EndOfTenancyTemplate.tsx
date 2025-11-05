import TemplateHeroSection from "@/components/TemplateHeroSection";
import TemplateH2Section from "@/components/TemplateH2Section";
import ProcessSection from "@/components/ProcessSection";
import TemplateWhyUsSection from "@/components/TemplateWhyUsSection";
import TemplateAboutSection from "@/components/TemplateAboutSection";
import TemplateServiceAreasSection from "@/components/TemplateServiceAreasSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ChecklistSection from "@/components/ChecklistSection";
import TemplateContentSection from "@/components/TemplateContentSection";
import TemplateFAQSection from "@/components/TemplateFAQSection";
import GuaranteeSection from "@/components/GuaranteeSection";

const EndOfTenancyTemplate = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Dynamic */}
      <TemplateHeroSection />
      
      {/* H2 Section - Dynamic */}
      <TemplateH2Section />
      
      {/* Process Section - Static */}
      <ProcessSection />
      
      {/* Why Us Section - Dynamic H3 */}
      <TemplateWhyUsSection />
      
      
      {/* Testimonials Section - Static */}
      <TestimonialsSection />
      
      {/* Checklist Section - Static */}
      <ChecklistSection />
      
      {/* Content Section - Dynamic */}
      <TemplateContentSection />
      
      {/* Service Areas Section - Dynamic */}
      <TemplateServiceAreasSection />
      
      {/* Guarantee Section - Static */}
      <GuaranteeSection />
      
      {/* FAQ Section - Dynamic + Static */}
      <TemplateFAQSection />
    </div>
  );
};

export default EndOfTenancyTemplate;