import { ClipboardList, Sparkles, Smile } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: 'Get Your Quote',
    description: 'Tell us about your space in under 2 minutes and receive a transparent, no-obligation price.',
  },
  {
    icon: Sparkles,
    title: 'We Clean',
    description: 'Our in-house trained team arrives on time with everything needed and follows a detailed room-by-room checklist.',
  },
  {
    icon: Smile,
    title: 'You Relax',
    description: 'Enjoy a spotless home and a photo report after every visit — total peace of mind, guaranteed.',
  },
];

const LandingHowItWorks = () => {
  return (
    <section className="bg-[#faf5ea] py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-block h-px w-12 bg-[#c9a84c] mb-5" />
          <h2
            className="text-3xl md:text-4xl font-semibold text-[#0d1b3d] tracking-wide mb-3 uppercase"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            How It Works
          </h2>
          <p className="text-[#0d1b3d]/60 max-w-2xl mx-auto text-sm md:text-base tracking-wide">
            Booking a professional clean has never been easier.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative bg-white border border-[#c9a84c]/20 p-8 text-center shadow-sm">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#0d1b3d] text-[#c9a84c] text-sm font-bold flex items-center justify-center shadow-md border-2 border-[#c9a84c]" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {i + 1}
                </div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#c9a84c]/40 mb-5 mt-3">
                  <Icon className="h-6 w-6 text-[#c9a84c]" />
                </div>
                <h3
                  className="text-lg font-semibold text-[#0d1b3d] mb-3 uppercase tracking-wider"
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

export default LandingHowItWorks;