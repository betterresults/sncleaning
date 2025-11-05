import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "Which areas of London and Essex do you cover?",
      answer: "Our service area is extensive, covering all London boroughs within the M25 and a wide range of towns across Essex. Our dedicated local teams are positioned throughout the capital to provide a fast and reliable service, whether you are in North, South, East, West, or Central London. Essentially, if your property is within the M25 motorway or our key Essex regions, we have you covered. For a detailed list of postcodes, please see our Areas We Serve page."
    },
    {
      question: "What's included in a standard professional cleaning service?",
      answer: (
        <div>
          <p>Our standard cleaning services (such as Domestic Cleaning and Deep Cleaning) are designed to be thorough and comprehensive. While every home is unique, our service always includes a detailed clean of all rooms. We don't just tidy; we deep clean. This includes:</p>
          <ul className="list-disc list-inside mt-4 space-y-2">
            <li><strong>Kitchen:</strong> Wiping all surfaces and cabinet fronts, cleaning the hob and extractor fan, cleaning the microwave inside and out, scrubbing the sink and taps, and vacuuming/mopping the floor.</li>
            <li><strong>Bathrooms:</strong> Fully sanitising the toilet, shower, and bath, descaling taps and showerheads, cleaning all mirrors and glass, and washing the floor.</li>
            <li><strong>Bedrooms & Living Areas:</strong> Dusting all surfaces (including skirting boards and light fittings), polishing any wooden furniture, cleaning internal windows, and thoroughly vacuuming all carpets and mopping hard floors.</li>
          </ul>
        </div>
      )
    },
    {
      question: "Are your cleaners insured, background-checked, and employed by you?",
      answer: "Yes, and we believe this is one of the most important factors in choosing a cleaning service. For your peace of mind, every member of our team is a direct employee, not a temporary contractor. They each undergo a rigorous vetting process which includes identity verification, background checks, and reference checks. Furthermore, we are fully covered by comprehensive public liability insurance, protecting your home and belongings against any accidental damage."
    },
    {
      question: "Do I need to provide any cleaning equipment or supplies?",
      answer: "No, you don't need to provide a thing. Our professional cleaners arrive at your property fully equipped with all the necessary high-quality equipment, from professional-grade vacuum cleaners to specialised tools. We also bring our own range of effective, safe, and eco-friendly cleaning products to ensure a perfect finish every time."
    },
    {
      question: "How does your pricing work? Is it a fixed price or an hourly rate?",
      answer: "We believe in transparent and fair pricing with no surprises. For our specialised services like End of Tenancy Cleaning and After Builders Cleaning, we provide a fixed, all-inclusive quote based on the size and condition of your property. For our regular Domestic Cleaning services, we can arrange a consistent weekly or bi-weekly rate. You will always know the full price upfront before we begin any work."
    },
    {
      question: "Can I book a recurring service, for example, weekly or fortnightly?",
      answer: "Yes, absolutely. A large number of our clients in London and Essex rely on our recurring Domestic Cleaning services to keep their homes consistently clean and fresh. We can arrange a schedule that works for you, whether it's weekly, every two weeks, or monthly. Recurring clients often benefit from a preferred time slot and a dedicated cleaner who becomes familiar with their home's specific needs."
    },
    {
      question: "What is your satisfaction guarantee?",
      answer: "We stand by the quality of our work with a rock-solid satisfaction guarantee. For our specialised services like End of Tenancy Cleaning, we offer a 72-hour re-clean guarantee. This means if your landlord or letting agent is unsatisfied with any aspect of the clean during the checkout inspection, we will return to the property and rectify it completely free of charge. Your satisfaction is our measure of success."
    },
    {
      question: "Do you offer specialised services beyond regular home cleaning?",
      answer: "Yes, we do. While regular domestic cleaning is a core part of our business, we are also specialists in a range of more intensive services. This includes our guaranteed End of Tenancy Cleaning for tenants moving out, After Builders Cleaning to handle post-construction dust and debris, and detailed Commercial Cleaning for offices, schools, and nurseries. You can learn more about all of our offerings on our main Services page."
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
            Got questions? We've got answers. Here are the most common questions about our professional cleaning services.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
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

export default FAQSection;