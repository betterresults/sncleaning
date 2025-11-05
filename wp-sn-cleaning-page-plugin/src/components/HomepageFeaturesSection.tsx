import { Zap, Clock, Shield, Users, Smartphone, Calendar, HeadphonesIcon, Star, CheckCircle } from "lucide-react";

const HomepageFeaturesSection = () => {
  const features = [
    {
      icon: Zap,
      title: "Same Day Emergency Cleaning",
      shortDescription: "Available 7 days a week",
      fullDescription: "Need urgent cleaning? We offer same-day emergency services to handle any cleaning crisis. Professional equipment and experienced team ready when you need us most."
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      shortDescription: "Your time, your choice",
      fullDescription: "Book cleaning services that fit your schedule. Early morning, evening, weekend, and holiday slots available. Change or reschedule appointments easily through our booking system."
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Customer Support",
      shortDescription: "Always here for you",
      fullDescription: "Questions or concerns? Our customer support team is available around the clock to help you. Call, text, or message us anytime for quick response."
    },
    {
      icon: Shield,
      title: "Satisfaction Guarantee",
      shortDescription: "100% satisfaction promise",
      fullDescription: "Not happy with the service? We'll come back and make it right at no additional cost. Your satisfaction is our top priority with our guarantee."
    },
    {
      icon: Users,
      title: "Dedicated Team Assignment",
      shortDescription: "Consistent quality",
      fullDescription: "Get the same professional cleaning team every visit for consistent, personalized service. Build relationships with trusted cleaners who know your preferences."
    },
    {
      icon: Smartphone,
      title: "Online Customer Portal",
      shortDescription: "24/7 online access",
      fullDescription: "Manage your bookings, track cleaning progress, and communicate with your team through our portal. Easy online management of all your cleaning services."
    },
    {
      icon: Calendar,
      title: "Easy Rebooking",
      shortDescription: "One-click rebooking",
      fullDescription: "Love your service? Rebook your favorite cleaner with just one click through your customer portal. Quick and easy repeat bookings for regular customers."
    },
    {
      icon: Star,
      title: "Quality Assurance",
      shortDescription: "Consistently excellent",
      fullDescription: "Every cleaning is quality-checked and rated to ensure we maintain our high standards. Regular training and performance monitoring for exceptional results."
    },
    {
      icon: CheckCircle,
      title: "Licensed & Insured",
      shortDescription: "Fully protected service",
      fullDescription: "All our cleaners are fully licensed and insured for your peace of mind. Comprehensive coverage protects your property and gives you confidence in our service."
    }
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-foreground via-primary-dark to-foreground">
      <div className="section-container">
        <div className="text-center mb-16">
          <div className="inline-block bg-primary/20 text-primary px-6 py-3 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-primary/30">
            WHY WE'RE DIFFERENT
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-white leading-tight mb-6">
            Features That Make Us
            <span className="text-primary block">The Professional Choice</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            We've built our service around what matters most to you - convenience, quality, 
            and peace of mind. Here's what sets us apart from the competition.
          </p>
        </div>

        {/* Features Grid - 3x3 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xl font-bold font-heading text-white group-hover:text-primary transition-colors">
                    {feature.title}
                  </h4>
                  
                  {/* Short description - always visible */}
                  <p className="text-primary font-medium text-sm">
                    {feature.shortDescription}
                  </p>
                  
                  {/* Full description - visible on hover */}
                  <div className="overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-32">
                    <p className="text-slate-300 text-sm leading-relaxed pt-2">
                      {feature.fullDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/10 shadow-xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">98%</div>
              <div className="text-slate-300 font-medium">Customer Retention Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">15min</div>
              <div className="text-slate-300 font-medium">Average Response Time</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">50K+</div>
              <div className="text-slate-300 font-medium">Successful Cleanings</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="text-slate-300 font-medium">Support Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomepageFeaturesSection;