import { Sparkles, Star } from "lucide-react";

const TemplateContentSection = () => {
  return (
    <section className="section-padding bg-gradient-to-r from-muted/30 via-background to-muted/30 border-y border-border/50">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Why Choose Us</span>
          </div>
          <h4 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            <span className="bg-green-300/30 px-2 py-1 rounded">[page_h4]</span>
          </h4>
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
                
                <p className="text-lg text-muted-foreground leading-relaxed bg-green-300/30 px-2 py-1 rounded">
                  [page_h4_paragraph_1]
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
                  <h3 className="text-2xl font-bold text-foreground">Trusted Professionals</h3>
                </div>
                
                <p className="text-lg text-muted-foreground leading-relaxed bg-green-300/30 px-2 py-1 rounded">
                  [page_h4_paragraph_2]
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default TemplateContentSection;