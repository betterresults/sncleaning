import { Star, Award, Users, Shield, Heart, Sparkles, CheckCircle, Clock, MapPin, BadgeCheck, Leaf, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import professionalCleaner from "@/assets/professional-cleaner.jpg";
import heroKitchen from "@/assets/hero-kitchen.jpg";
import domesticCleaning from "@/assets/domestic-cleaning.jpg";
import carpetCleaning from "@/assets/carpet-cleaning.jpg";

const AboutUs = () => {
  const expertise = [
    {
      title: "End of Tenancy Specialists",
      description: "99.8% deposit return rate with comprehensive checklists approved by major letting agents",
      icon: BadgeCheck,
      image: heroKitchen
    },
    {
      title: "Domestic Cleaning Excellence",
      description: "Regular and one-off cleaning services tailored to your lifestyle and schedule",
      icon: Heart,
      image: domesticCleaning
    },
    {
      title: "Deep Cleaning Experts",
      description: "Professional-grade equipment and eco-friendly products for thorough sanitization",
      icon: Sparkles,
      image: carpetCleaning
    }
  ];

  const certifications = [
    { icon: BadgeCheck, text: "Fully Insured & Bonded" },
    { icon: Shield, text: "Background Checked Staff" },
    { icon: Leaf, text: "Eco-Friendly Certified" },
    { icon: Award, text: "Industry Accredited" }
  ];

  const timeline = [
    { year: "2016", milestone: "Founded in London", description: "Started with a vision to transform cleaning services" },
    { year: "2018", milestone: "1,000+ Happy Customers", description: "Reached first major customer milestone" },
    { year: "2020", milestone: "Expanded Service Range", description: "Added specialized cleaning services" },
    { year: "2023", milestone: "8,000+ Satisfied Clients", description: "Became one of London's most trusted names" }
  ];

  const whyChooseUs = [
    {
      icon: Clock,
      title: "Same-Day Service Available",
      description: "Need urgent cleaning? We can be there within hours, not days."
    },
    {
      icon: ThumbsUp,
      title: "100% Satisfaction Guarantee",
      description: "If you're not completely satisfied, we'll re-clean for free or refund your money."
    },
    {
      icon: MapPin,
      title: "All London Areas Covered",
      description: "From Zone 1 to Zone 6, we serve the entire Greater London area."
    },
    {
      icon: Leaf,
      title: "Eco-Friendly Products",
      description: "Safe for your family, pets, and the environment without compromising on results."
    }
  ];

  const stats = [
    { icon: Star, number: "8,000+", label: "Happy Customers", sublabel: "Across Greater London" },
    { icon: Award, number: "99.8%", label: "Deposit Returns", sublabel: "For end of tenancy" },
    { icon: Users, number: "50+", label: "Expert Cleaners", sublabel: "Fully trained & vetted" },
    { icon: Clock, number: "8+", label: "Years Experience", sublabel: "Trusted since 2016" }
  ];

  const handleQuoteClick = () => {
    window.location.href = 'tel:02038355033';
  };

  return (
    <div className="min-h-screen bg-background">
      
      {/* Hero Section */}
      <section className="relative section-padding pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroKitchen} 
            alt="Professional cleaning services"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70"></div>
        </div>
        
        <div className="section-container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-5xl lg:text-7xl font-bold font-heading text-white leading-tight animate-fade-in">
              About <span className="text-primary">SN Cleaning</span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
              London's trusted professional cleaning service – reliable, thorough, and committed to excellence.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="section-padding bg-background">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
                Who <span className="text-primary">We Are</span>
              </h2>
              
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  SN Cleaning was founded in 2016 with a simple mission: to provide London residents with cleaning services they can genuinely trust. What started as a small team of dedicated professionals has grown into a company serving over 8,000 satisfied customers across Greater London.
                </p>
                
                <p>
                  <strong className="text-foreground">We're a family-run business</strong> that treats every home as if it were our own. Our team consists of 50+ professionally trained cleaners, each carefully selected and thoroughly vetted to ensure they meet our exacting standards.
                </p>

                <p>
                  Every single cleaner undergoes comprehensive background checks, extensive training in professional cleaning techniques, and certification in the safe use of our eco-friendly products. We don't just hire cleaners – we invest in building a team of trusted professionals.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-gradient-surface rounded-lg">
                    <cert.icon className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-sm font-semibold text-foreground">{cert.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-in">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={professionalCleaner} 
                  alt="Professional SN Cleaning team member"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <p className="text-2xl font-bold mb-2">50+ Trained Professionals</p>
                  <p className="text-lg opacity-90">Every cleaner is background-checked and certified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Train Our Team */}
      <section className="section-padding bg-gradient-surface">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
              How We Train <span className="text-primary">Our Cleaners</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              We don't just hire cleaners – we develop trusted professionals through rigorous training
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <div className="bg-background p-8 rounded-2xl space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <BadgeCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Comprehensive Background Checks</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Every candidate undergoes thorough criminal background checks, identity verification, and reference checks before joining our team. Your safety and security are non-negotiable.
              </p>
            </div>

            <div className="bg-background p-8 rounded-2xl space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">3-Week Professional Training</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                New team members complete an intensive 3-week training program covering professional cleaning techniques, customer service, safety protocols, and proper use of equipment and eco-friendly products.
              </p>
            </div>

            <div className="bg-background p-8 rounded-2xl space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Fully Insured & Bonded</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                All our cleaners are covered by comprehensive insurance, including public liability and employer's liability. You're protected, and so are they.
              </p>
            </div>

            <div className="bg-background p-8 rounded-2xl space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Ongoing Quality Assessments</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our team undergoes regular performance reviews, customer feedback assessments, and continuous training to maintain our high standards and stay updated on best practices.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-background rounded-2xl p-8 border-2 border-primary/20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-foreground">Why This Matters to You</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  When you book SN Cleaning, you're not getting random contractors. You're getting professionally trained, thoroughly vetted cleaners who understand exactly what they're doing. This means consistent quality, trustworthy service, and peace of mind every single time.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  "No subcontractors – only our trained team",
                  "Same high standards on every visit",
                  "Professional-grade equipment & products",
                  "Respectful treatment of your home",
                  "Accountable, trackable service"
                ].map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="section-padding bg-background">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative animate-fade-in order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroKitchen} 
                  alt="Spotlessly cleaned kitchen by SN Cleaning"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </div>

            <div className="space-y-6 animate-fade-in order-1 lg:order-2">
              <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
                Why We're <span className="text-primary">Different</span>
              </h2>
              
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Most cleaning companies make big promises. We focus on delivering results you can see and trust.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-gradient-surface rounded-xl">
                    <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-foreground mb-1">We Show Up On Time</h4>
                      <p className="text-muted-foreground">Your time is valuable. We respect that with punctual, reliable service.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-surface rounded-xl">
                    <Leaf className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Eco-Friendly & Safe</h4>
                      <p className="text-muted-foreground">Professional results without harsh chemicals. Safe for your family, pets, and the planet.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-surface rounded-xl">
                    <ThumbsUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Deposit Return Guarantee</h4>
                      <p className="text-muted-foreground">Our end-of-tenancy cleaning meets landlord and agent standards every time.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-surface rounded-xl">
                    <Heart className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-foreground mb-1">We Actually Care</h4>
                      <p className="text-muted-foreground">This isn't just a job for us. We take pride in helping you live in a cleaner, healthier space.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Our Expertise */}
      <section className="section-padding bg-gradient-surface">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
              Our <span className="text-primary">Expertise</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Specialized cleaning services backed by years of experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {expertise.map((area, idx) => (
              <div key={idx} className="bg-background rounded-2xl overflow-hidden hover:shadow-xl transition-all hover-scale group">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={area.image} 
                    alt={area.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
                      <area.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">{area.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{area.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Journey Timeline */}
      <section className="section-padding bg-background">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
              Our <span className="text-primary">Journey</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              From a small startup to London's most trusted cleaning service
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-8 items-start group">
                  <div className="flex-shrink-0 w-32 text-right">
                    <div className="inline-block px-4 py-2 bg-primary/10 rounded-lg">
                      <span className="text-2xl font-bold text-primary">{item.year}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 relative">
                    <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/20 group-hover:ring-8 transition-all"></div>
                    {idx < timeline.length - 1 && (
                      <div className="absolute top-4 left-1/2 w-0.5 h-full bg-primary/20 -translate-x-1/2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{item.milestone}</h3>
                    <p className="text-lg text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-background">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
              Why London Residents <span className="text-primary">Choose Us</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Real benefits that make a real difference
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {whyChooseUs.map((reason, idx) => (
              <div key={idx} className="bg-gradient-surface p-8 rounded-2xl hover:shadow-xl transition-all hover-scale">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <reason.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{reason.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Guarantee Section */}
      <section className="section-padding bg-background">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-12 text-center space-y-8 border-2 border-primary/20">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-10 h-10 text-primary-foreground" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground">
                  Our <span className="text-primary">Promise to You</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  If we don't meet your expectations, we'll re-clean your space for free. And if you're still not satisfied, we'll refund your money. No questions asked. That's how confident we are in our service.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-6 pt-8">
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-primary mx-auto" />
                  <p className="font-semibold text-foreground">Professional Standards</p>
                </div>
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-primary mx-auto" />
                  <p className="font-semibold text-foreground">On-Time Guarantee</p>
                </div>
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-primary mx-auto" />
                  <p className="font-semibold text-foreground">100% Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary-dark to-primary/80 text-white">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold font-heading">
              Ready to See the <span className="bg-gradient-to-r from-white to-primary-glow bg-clip-text text-transparent">Difference</span>?
            </h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Join over 8,000 satisfied customers across London. Get your free quote today.
            </p>
            <Button 
              size="lg" 
              onClick={handleQuoteClick}
              className="bg-white text-primary hover:bg-white/90 text-lg px-12 py-6 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              Get Instant Quote
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
