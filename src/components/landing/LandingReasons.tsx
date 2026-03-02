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
    <section className="bg-white py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#185166] text-center mb-4">
          3 Key Reasons Clients Choose SN Cleaning Services
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          We don't just clean — we give you full visibility and control over the process.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#18A5A5]/10 mb-5">
                  <Icon className="h-7 w-7 text-[#18A5A5]" />
                </div>
                <h3 className="text-lg font-bold text-[#185166] mb-3">{r.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{r.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingReasons;
