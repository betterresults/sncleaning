import { Sparkles, Star } from "lucide-react";

const ContentSection = () => {
  return (
    <section className="section-padding bg-gradient-to-r from-muted/30 via-background to-muted/30 border-y border-border/50">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Why Choose Us</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            More than just <span className="text-primary">cleaning</span>
          </h2>
        </div>

        {/* Content Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Content Card */}
            <div className="bg-card border border-border rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Premium Standards</h3>
                </div>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We understand that moving out is stressful enough without worrying about your deposit. 
                  That's why we've perfected our end of tenancy cleaning service to meet the highest 
                  standards expected by letting agents and landlords across London.
                </p>
              </div>
            </div>

            {/* Right Content Card */}
            <div className="bg-card border border-border rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Professional Excellence</h3>
                </div>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our experienced team combines years of expertise with professional-grade equipment 
                  and eco-friendly cleaning products. We don't just clean – we restore your property 
                  to its original condition, ensuring you get your full deposit back while giving 
                  you peace of mind during your move.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Feature */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center gap-4 bg-primary/5 border border-primary/20 px-8 py-4 rounded-2xl">
              <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
              <span className="text-xl font-semibold text-foreground">
                Your deposit protection is our guarantee
              </span>
              <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentSection;