import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'How is the price calculated?',
    a: 'Your price is based on the size of your property, the type of clean and any extras you choose. You get a transparent quote upfront — no hidden fees, ever.',
  },
  {
    q: 'Are your cleaners insured and vetted?',
    a: 'Yes. Every cleaner is in-house trained, fully vetted and we carry full public liability insurance for complete peace of mind.',
  },
  {
    q: 'Can I cancel or reschedule my booking?',
    a: 'Absolutely. You can cancel or reschedule for free up to 48 hours before your booking.',
  },
  {
    q: 'Do you bring your own cleaning supplies?',
    a: 'Yes — our team arrives fully equipped with professional-grade products and equipment. Just let us know if you prefer eco-friendly products.',
  },
  {
    q: 'What if I am not happy with the clean?',
    a: 'We offer a satisfaction guarantee. If something is missed, let us know within 24 hours and we will come back to put it right at no extra cost.',
  },
  {
    q: 'How do I pay?',
    a: 'Payment is made securely online when you book. We accept all major debit and credit cards via Stripe.',
  },
];

const LandingFAQ = () => {
  return (
    <section className="bg-[#F5FAFB] py-14 md:py-20">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#185166] text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-500 mb-10">
          Everything you need to know before booking your clean.
        </p>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm px-5"
            >
              <AccordionTrigger className="text-left text-[#185166] font-semibold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default LandingFAQ;