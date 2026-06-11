import { Home, Sparkles, Building2, KeyRound, Flame } from 'lucide-react';

const services = [
  {
    icon: KeyRound,
    title: 'End of Tenancy',
    description: 'Agency-approved deep cleans with our 100% deposit-back guarantee.',
  },
  {
    icon: Sparkles,
    title: 'Deep Cleaning',
    description: 'Top-to-bottom restoration for kitchens, bathrooms and every neglected corner.',
  },
  {
    icon: Home,
    title: 'Domestic Cleaning',
    description: 'Weekly, fortnightly or one-off home cleans by the same trusted cleaner.',
  },
  {
    icon: Building2,
    title: 'Airbnb & Short-Lets',
    description: 'Turnaround cleans with linen change between guests — fast and reliable.',
  },
  {
    icon: Flame,
    title: 'Oven Cleaning',
    description: 'Fixed-price professional oven, hob and extractor degreasing.',
  },
];

const LandingServices = () => {
  return (
    <section className="bg-white py-14 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#185166] text-center mb-4">
          Services We Offer
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          One trusted team for every type of clean your home needs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#18A5A5]/40 transition-all"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#18A5A5]/10 mb-4 group-hover:bg-[#18A5A5]/20 transition-colors">
                  <Icon className="h-6 w-6 text-[#18A5A5]" />
                </div>
                <h3 className="text-lg font-bold text-[#185166] mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingServices;