import { CheckCircle, Users, Shield } from "lucide-react";
import professionalImage from "@/assets/professional-cleaner.jpg";

const TemplateWhyUsSection = () => {
  const features = [
    {
      icon: Shield,
      title: "Deposit Back Guarantee",
      description: "Our 72-hour re-clean guarantee means if there's an issue, we return and fix it, free of charge. Your deposit is safe with us."
    },
    {
      icon: Users,
      title: "Professionally Trained Team",
      description: "Our full-time employees are vetted, insured, and rigorously trained on an agency-approved checklist for unmatched quality."
    },
    {
      icon: CheckCircle,
      title: "Agency-Approved Standards",
      description: "We follow strict protocols that satisfy even the most demanding letting agents and property managers."
    }
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-foreground via-primary-dark to-foreground">
      <div className="section-container">
        <div className="space-y-16">
          {/* Dynamic H3 Title */}
          <div className="text-center">
            <h3 className="text-4xl lg:text-5xl font-bold font-heading text-white leading-tight mb-6">
              <span className="bg-blue-300/30 px-2 py-1 rounded">[page_h3]</span>
            </h3>
          </div>

          {/* Two-column layout: Image + Dynamic Paragraph */}
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: Image */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl">
                {/* Background decoration */}
                <div className="absolute -top-8 -left-8 w-full h-full bg-gradient-primary rounded-3xl opacity-20 z-0" />
                
                {/* Main image */}
                <div className="relative z-10 bg-white p-4 rounded-3xl shadow-primary">
                  <img
                    src="[page_image]"
                    alt="Professional cleaner meticulously cleaning a modern space"
                    className="w-full h-96 object-cover rounded-2xl"
                  />
                </div>
                
                {/* Floating badges */}
                <div className="absolute bottom-4 right-4 bg-white rounded-2xl p-4 shadow-lg z-20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-slate-800">Licensed & Insured</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Dynamic Paragraph */}
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <p className="text-lg text-slate-300 leading-relaxed bg-blue-300/30 px-2 py-1 rounded">
                [page_h3_paragraph]
              </p>
            </div>
          </div>

          {/* Three features in horizontal row below */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-semibold font-heading text-white">
                      {feature.title}
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
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

export default TemplateWhyUsSection;