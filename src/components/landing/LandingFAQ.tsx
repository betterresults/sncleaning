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
    <section className="bg-[#faf5ea] py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block h-px w-12 bg-[#c9a84c] mb-5" />
          <h2
            className="text-3xl md:text-4xl font-semibold text-[#0d1b3d] tracking-wide mb-3 uppercase"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-[#0d1b3d]/60 text-sm md:text-base tracking-wide">
            Everything you need to know before booking your clean.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-white border border-[#c9a84c]/25 shadow-sm px-5"
            >
              <AccordionTrigger className="text-left text-[#0d1b3d] font-semibold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[#0d1b3d]/70 text-sm leading-relaxed">
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