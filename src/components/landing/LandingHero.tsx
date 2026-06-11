import heroCleaningBg from '@/assets/hero-cleaning-bg.jpg';

const LandingHero = () => {
  return (
    <section className="relative overflow-hidden text-white">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroCleaningBg})` }}
      />

      {/* Navy overlay to match brand palette */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b3d]/92 to-[#0a1530]/88" />

      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, #c9a84c 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
        <div className="inline-block h-px w-12 bg-[#c9a84c] mb-5" />
        <div className="text-[#c9a84c] uppercase tracking-[0.3em] text-xs md:text-sm font-semibold mb-6">
          London &amp; Essex's Trusted Cleaning Company
        </div>

        <h1
          className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-6 uppercase tracking-wide"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Reliable &amp; Consistent
          <br />
          <span className="text-[#c9a84c]">Cleaning In London &amp; Essex</span>
        </h1>

        <div className="flex justify-center mb-6">
          <div className="h-px w-16 bg-[#c9a84c]/60" />
        </div>

        <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
          In-house trained staff, dedicated supervisors, detailed checklists, and photo reports after every clean — so you never have to worry.
        </p>
      </div>
    </section>
  );
};

export default LandingHero;
