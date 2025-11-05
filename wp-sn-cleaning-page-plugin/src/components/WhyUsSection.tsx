import { CheckCircle, Users, Shield, Clock, Phone, Star } from "lucide-react";
import professionalImage from "@/assets/professional-cleaner.jpg";

const WhyUsSection = () => {
  const features = [
    {
      icon: Shield,
      title: "Same Day Emergency Cleaning",
      shortDescription: "Available 7 days a week",
      fullDescription: "Need urgent cleaning? Our emergency cleaning service is available 7 days a week with rapid response times. Professional equipment and experienced team ready when you need us most."
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      shortDescription: "Fits your busy lifestyle",
      fullDescription: "Book cleaning services that work around your schedule. Evening, weekend, and holiday slots available. Change or reschedule appointments easily through our booking system."
    },
    {
      icon: Phone,
      title: "24/7 Customer Support",
      shortDescription: "Always here to help",
      fullDescription: "Round-the-clock customer support for all your cleaning needs. Call, text, or message us anytime. Quick response to questions, booking changes, and special requests."
    },
    {
      icon: Users,
      title: "Professionally Trained Team",
      shortDescription: "Vetted and insured professionals",
      fullDescription: "Our full-time employees are vetted, insured, and rigorously trained on agency-approved checklists. Background-checked professionals you can trust in your home or business."
    },
    {
      icon: CheckCircle,
      title: "Deposit Back Guarantee",
      shortDescription: "72-hour re-clean promise",
      fullDescription: "Our 72-hour re-clean guarantee means if there's an issue, we return and fix it free of charge. Your deposit is safe with our meticulous end of tenancy cleaning service."
    },
    {
      icon: Star,
      title: "Agency-Approved Standards",
      shortDescription: "Exceeds letting agent requirements",
      fullDescription: "We follow strict protocols that satisfy even the most demanding letting agents and property managers. Comprehensive checklists ensure nothing is missed."
    }
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-foreground via-primary-dark to-foreground">
      <div className="section-container">
        <div className="space-y-16">
          {/* Title and Description */}
          <div className="text-center">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-white leading-tight mb-6">
              Your trusted <span className="text-primary">local cleaning experts</span>
            </h2>
            
            <p className="text-lg text-slate-300 leading-relaxed max-w-4xl mx-auto mb-8">
              Professional licensed and insured cleaning experts in South Hornchurch. 
              We guarantee your satisfaction with features that make us the professional choice.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Professional Image Section */}
          <div className="flex justify-center">
            <div className="relative max-w-md">
              <div className="relative overflow-hidden rounded-3xl">
                {/* Background decoration */}
                <div className="absolute -top-4 -left-4 w-full h-full bg-gradient-primary rounded-3xl opacity-20 z-0" />
                
                {/* Main image */}
                <div className="relative z-10 bg-white/10 backdrop-blur-sm p-4 rounded-3xl shadow-2xl border border-white/20">
                  <img
                    src={professionalImage}
                    alt="Professional cleaner meticulously cleaning a modern space"
                    className="w-full h-64 object-cover rounded-2xl"
                  />
                </div>
                
                {/* Floating badge */}
                <div className="absolute bottom-4 right-4 bg-white rounded-2xl p-3 shadow-lg z-20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-slate-800">Licensed & Insured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;