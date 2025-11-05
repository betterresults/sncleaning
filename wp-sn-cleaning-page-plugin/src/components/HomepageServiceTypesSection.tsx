import { Button } from "@/components/ui/button";
import { trackEvent } from "@/utils/analytics";
import { ArrowRight } from "lucide-react";

// Import cleaning images
import endOfTenancyImage from "@/assets/end-of-tenancy-cleaning.jpg";
import afterBuildersImage from "@/assets/after-builders-cleaning.jpg";
import domesticCleaningImage from "@/assets/domestic-cleaning.jpg";
import airbnbCleaningImage from "@/assets/airbnb-cleaning.jpg";
import officeCleaningImage from "@/assets/office-cleaning.jpg";
import carpetCleaningImage from "@/assets/carpet-cleaning.jpg";

const HomepageServiceTypesSection = () => {
  const residentialServices = [
    {
      image: endOfTenancyImage,
      title: "End of Tenancy",
      description: "Complete move-out cleaning to get your deposit back with professional standards and equipment."
    },
    {
      image: afterBuildersImage,
      title: "After Builders",
      description: "Post-construction cleanup and dust removal including paint splatter cleaning and surface restoration."
    },
    {
      image: domesticCleaningImage,
      title: "Domestic Cleaning",
      description: "Regular weekly, fortnightly or monthly home cleaning with flexible scheduling and consistent quality."
    },
    {
      image: airbnbCleaningImage,
      title: "Airbnb Cleaning",
      description: "Turnaround cleaning for short-term rentals with quick service and guest-ready standards."
    },
    {
      image: domesticCleaningImage,
      title: "Deep House Cleaning",
      description: "Comprehensive one-time deep cleaning service covering every corner and inside appliances."
    },
    {
      image: carpetCleaningImage,
      title: "Carpet Cleaning",
      description: "Professional carpet and upholstery cleaning with steam cleaning and fast drying technology."
    }
  ];

  const commercialServices = [
    {
      image: officeCleaningImage,
      title: "Office Cleaning",
      description: "Professional office maintenance and sanitization with daily or weekly service options."
    },
    {
      image: officeCleaningImage,
      title: "School Cleaning",
      description: "Educational facility cleaning with child-safe products and classroom sanitization."
    },
    {
      image: officeCleaningImage,
      title: "Nursery Cleaning",
      description: "Specialized cleaning for childcare facilities using only non-toxic products."
    },
    {
      image: officeCleaningImage,
      title: "Retail Cleaning",
      description: "Specialized cleaning for retail environments with customer-friendly hours."
    }
  ];

  const handleLearnMore = (serviceType: string) => {
    trackEvent('learn_more_click', {
      location: 'homepage_service_types',
      service_type: serviceType
    });
  };

  return (
    <section className="section-padding bg-gradient-to-b from-muted/30 to-background">
      <div className="section-container">
        {/* Residential Services */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
              Residential Cleaning Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional home cleaning solutions with real people who care about your space
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {residentialServices.map(({ image, title, description }, idx) => (
              <div key={idx} className="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={image} 
                    alt={`${title} cleaning service`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-6 group-hover:bg-primary group-hover:text-white transition-colors"
                    onClick={() => handleLearnMore(`residential_${title.toLowerCase().replace(/\s+/g, '_')}`)}
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial Services */}
        <div>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
              Commercial Cleaning Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional business cleaning with experienced teams you can trust
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {commercialServices.map(({ image, title, description }, idx) => (
              <div key={idx} className="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={image} 
                    alt={`${title} cleaning service`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                  
                  <Button 
                    className="btn-primary w-full mt-4 group/btn"
                    onClick={() => handleLearnMore(`commercial_${title.toLowerCase().replace(/\s+/g, '_')}`)}
                  >
                    Get Quote
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomepageServiceTypesSection;