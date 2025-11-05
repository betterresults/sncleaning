import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TemplateFAQSection = () => {
  const staticFaqs = [
    {
      question: "Do I need to be present during the cleaning?",
      answer: "No, you don't need to be present. Many of our clients prefer to hand over the keys and let us work undisturbed. We're fully insured and bonded for your peace of mind."
    },
    {
      question: "What cleaning products do you use?",
      answer: "We use professional-grade, eco-friendly cleaning products that are safe for all surfaces. All equipment and supplies are provided by us - you don't need to prepare anything."
    },
    {
      question: "How much does an end of tenancy clean cost?",
      answer: "Prices vary based on property size and condition. We offer competitive rates with no hidden fees. You can book online or get a quote online within two minutes by filling our form. Contact us for a free, no-obligation quote tailored to your specific needs."
    }
  ];

  return (
    <section className="section-padding bg-gradient-surface">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers about our <span className="bg-purple-300/30 px-1 rounded">[page_borough]</span> cleaning service.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {/* Dynamic FAQ 1 */}
            <AccordionItem 
              value="dynamic-1"
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="font-semibold text-foreground bg-purple-300/30 px-2 py-1 rounded">[page_question_1]</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                <span className="bg-purple-300/30 px-2 py-1 rounded">[page_answer_1]</span>
              </AccordionContent>
            </AccordionItem>

            {/* Dynamic FAQ 2 */}
            <AccordionItem 
              value="dynamic-2"
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="font-semibold text-foreground bg-purple-300/30 px-2 py-1 rounded">[page_question_2]</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                <span className="bg-purple-300/30 px-2 py-1 rounded">[page_answer_2]</span>
              </AccordionContent>
            </AccordionItem>

            {/* Static FAQs */}
            {staticFaqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`static-${index}`}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold text-foreground">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default TemplateFAQSection;