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
    <section className="bg-[#f5efe2] py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-block h-px w-12 bg-[#c9a84c] mb-5" />
          <h2
            className="text-3xl md:text-4xl font-semibold text-[#0d1b3d] tracking-wide mb-3 uppercase"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Services We Offer
          </h2>
          <p className="text-[#0d1b3d]/60 max-w-2xl mx-auto text-sm md:text-base tracking-wide">
            One trusted team for every type of clean your home needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="group bg-white p-7 border border-[#c9a84c]/25 shadow-sm hover:shadow-md transition-all"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#c9a84c]/40 mb-4 group-hover:border-[#c9a84c] transition-colors">
                  <Icon className="h-5 w-5 text-[#c9a84c]" />
                </div>
                <h3
                  className="text-lg font-semibold text-[#0d1b3d] mb-2 uppercase tracking-wider"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {s.title}
                </h3>
                <p className="text-[#0d1b3d]/70 text-sm leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingServices;