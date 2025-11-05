import HomepageHeroSection from "@/components/HomepageHeroSection";
import HomepageServiceTypesSection from "@/components/HomepageServiceTypesSection";
import HomepageBookingSection from "@/components/HomepageBookingSection";
import HomepageFeaturesSection from "@/components/HomepageFeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import EnhancedServiceAreasSection from "@/components/EnhancedServiceAreasSection";
import FAQSection from "@/components/FAQSection";
import RecentBlogPostsSection from "@/components/RecentBlogPostsSection";
import CallToActionSection from "@/components/CallToActionSection";

const Homepage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HomepageHeroSection />
      
      {/* Detailed Service Types Section */}
      <HomepageServiceTypesSection />
      
      {/* Features Section */}
      <HomepageFeaturesSection />
      
      {/* Simple Booking Process Section */}
      <HomepageBookingSection />
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* Enhanced Service Areas Section with Animated Map */}
      <EnhancedServiceAreasSection />
      
      {/* Recent Blog Posts Section */}
      <RecentBlogPostsSection />
      
      {/* Call to Action Get Quote Section */}
      <CallToActionSection />
      
      {/* FAQ Section */}
      <FAQSection />
    </div>
  );
};

export default Homepage;