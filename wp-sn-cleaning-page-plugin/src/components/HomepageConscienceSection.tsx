import { Leaf, Shield, Heart, CheckCircle } from "lucide-react";

const HomepageConscienceSection = () => {
  const features = [
    {
      icon: Leaf,
      title: "Eco-Friendly Products",
      description: "We use environmentally safe cleaning products that are gentle on your family and pets."
    },
    {
      icon: Shield,
      title: "Fully Insured & Bonded",
      description: "Complete peace of mind with comprehensive insurance coverage for all our services."
    },
    {
      icon: Heart,
      title: "Community Focused",
      description: "Supporting local families and businesses with reliable, caring cleaning services."
    }
  ];

  const benefits = [
    "Green cleaning methods and eco-friendly products",
    "Safe, non-toxic solutions for your family",
    "Professional staff background checked",
    "Fully insured for your protection"
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-primary/5 to-accent/5 border-t border-border/50">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                OUR PROMISE
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
                Cleaning With A
                <span className="text-primary block">Conscience</span>
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe in providing exceptional cleaning services while caring for our environment, 
                our community, and your family's wellbeing. Every service we provide reflects our 
                commitment to doing what's right.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-6">
            {features.map(({ icon: Icon, title, description }, idx) => (
              <div key={idx} className="bg-background rounded-2xl p-6 shadow-lg border border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomepageConscienceSection;