import heroAsset from '@/assets/hero-cleaner.jpg.asset.json';

const LandingHero = () => {
  return (
    <section className="bg-[#0b2545]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[520px] md:min-h-[600px]">
        {/* LEFT: Navy text panel with gold accents */}
        <div className="relative bg-gradient-to-br from-[#0b2545] via-[#0b2545] to-[#08203d] text-white px-6 md:px-14 py-14 md:py-20 flex flex-col justify-center overflow-hidden">
          {/* Subtle gold dot pattern */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, #c9a84c 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          {/* Gold corner ornament */}
          <div className="absolute top-6 left-6 w-12 h-12 border-t border-l border-[#c9a84c]/60 hidden md:block" />
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b border-r border-[#c9a84c]/60 hidden md:block" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-[#c9a84c]" />
              <span className="text-[#c9a84c] uppercase tracking-[0.28em] text-[10px] md:text-xs font-semibold">
                London &amp; Essex
              </span>
            </div>

            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] mb-6 uppercase"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Reliable &amp;
              <br />
              Consistent
              <br />
              <span className="text-[#c9a84c] italic font-medium normal-case" style={{ fontFamily: '"Playfair Display", serif' }}>
                Cleaning
              </span>
              <span className="text-white/90"> Done Right.</span>
            </h1>

            <div className="h-px w-16 bg-[#c9a84c] mb-6" />

            <p className="text-sm md:text-base text-white/75 max-w-md leading-relaxed mb-8">
              In-house trained staff, dedicated supervisors, detailed checklists, and photo reports after every clean — so you never have to worry.
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-widest text-white/70">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full" />
                Trusted &amp; Reliable
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full" />
                Vetted Team
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full" />
                Photo Reports
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Photo with soft gold frame */}
        <div className="relative min-h-[300px] lg:min-h-full">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroAsset.url})` }}
          />
          {/* Soft tint to harmonize with palette */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0b2545]/35 lg:to-[#0b2545]/15" />
          {/* Gold inset frame */}
          <div className="absolute inset-4 md:inset-6 border border-[#c9a84c]/40 pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
