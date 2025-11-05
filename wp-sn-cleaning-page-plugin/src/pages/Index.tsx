import HeroSection from "@/components/HeroSection";
import WhyUsSection from "@/components/WhyUsSection";
import ProcessSection from "@/components/ProcessSection";
import AboutSection from "@/components/AboutSection";
import ServiceAreasSection from "@/components/ServiceAreasSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ChecklistSection from "@/components/ChecklistSection";
import ContentSection from "@/components/ContentSection";
import FAQSection from "@/components/FAQSection";
import GuaranteeSection from "@/components/GuaranteeSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <AboutSection />
      <ProcessSection />
      <WhyUsSection />
      <TestimonialsSection />
      <ChecklistSection />
      <ContentSection />
      <FAQSection />
      <ServiceAreasSection />
      <GuaranteeSection />
    </div>
  );
};

export default Index;
