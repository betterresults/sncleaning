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
    <section className="bg-[#F5FAFB] py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#185166] text-center mb-4">
          How It Works
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          Booking a professional clean has never been easier.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#185166] text-white text-sm font-bold flex items-center justify-center shadow">
                  {i + 1}
                </div>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#18A5A5]/10 mb-5 mt-2">
                  <Icon className="h-7 w-7 text-[#18A5A5]" />
                </div>
                <h3 className="text-lg font-bold text-[#185166] mb-3">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingHowItWorks;