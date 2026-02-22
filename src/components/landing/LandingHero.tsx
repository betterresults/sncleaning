const LandingHero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#185166] to-[#0f3a4a] text-white">
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
          ✨ London & Essex's Trusted Cleaning Company
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
          Reliable & Consistent
          <br />
          <span className="text-[#18A5A5]">Cleaning In London & Essex</span>
        </h1>

        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
          In-house trained staff, dedicated supervisors, detailed checklists, and photo reports after every clean — so you never have to worry.
        </p>
      </div>
    </section>
  );
};

export default LandingHero;
