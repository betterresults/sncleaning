import { Calendar, ClipboardCheck, Sparkles, ThumbsUp } from "lucide-react";

const ProcessSection = () => {
  const steps = [
    {
      icon: Calendar,
      number: "01",
      title: "Book Your Service",
      description: "Choose your preferred date and time. We offer flexible scheduling including weekends and same-day service."
    },
    {
      icon: Sparkles,
      number: "02",
      title: "Meet Our Cleaner",
      description: "Our professional team arrives on time with all equipment and conducts a thorough assessment of your property."
    },
    {
      icon: ThumbsUp,
      number: "03",
      title: "Enjoy Your Deposit Back",
      description: "Relax knowing your property meets agency standards and your deposit is secure with our guarantee."
    }
  ];

  return (
    <section className="section-padding bg-background">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            Our <span className="text-primary">3-Step Process</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From booking to completion, we make the entire process simple and stress-free
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 -right-4 w-8 h-0.5 bg-primary/30 z-0" />
              )}
              
              <div className="card-glass p-6 text-center relative z-10 hover:shadow-lg transition-all duration-300">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </div>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ProcessSection;