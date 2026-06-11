import { ShieldCheck, ClipboardCheck, Camera } from 'lucide-react';

const reasons = [
  {
    icon: ShieldCheck,
    title: 'Consistency You Can Count On',
    description:
      'Every cleaner is in-house trained and supervised. No agency staff, no strangers — just a reliable team you can trust every single time.',
  },
  {
    icon: ClipboardCheck,
    title: 'Detailed Cleaning Checklists',
    description:
      'Every room has a checklist your cleaner follows step-by-step. Nothing gets missed, and you can see exactly what was done.',
  },
  {
    icon: Camera,
    title: 'Photo Reports After Every Clean',
    description:
      'After each visit, you receive a photo report showing the completed work. Peace of mind — even when you\'re not there.',
  },
];

const LandingReasons = () => {
  return (
    <section className="bg-[#f5efe2] py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-block h-px w-12 bg-[#c9a84c] mb-5" />
          <h2
            className="text-3xl md:text-4xl font-semibold text-[#0d1b3d] tracking-wide mb-3 uppercase"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Why Clients Choose Us
          </h2>
          <p className="text-[#0d1b3d]/60 max-w-2xl mx-auto text-sm md:text-base tracking-wide">
            We don't just clean — we give you full visibility and control over the process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#c9a84c]/50 mb-5">
                  <Icon className="h-7 w-7 text-[#c9a84c]" />
                </div>
                <h3
                  className="text-lg font-semibold text-[#0d1b3d] mb-3 uppercase tracking-wider"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {r.title}
                </h3>
                <p className="text-[#0d1b3d]/70 text-sm leading-relaxed">{r.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingReasons;
