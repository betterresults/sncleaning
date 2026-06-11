import heroPoster from '@/assets/landing-hero-poster.png';

const LandingHero = () => {
  return (
    <section className="bg-[#f5efe2]">
      <div className="max-w-5xl mx-auto px-0 md:px-4 pt-0 md:pt-8">
        <img
          src={heroPoster}
          alt="SN Cleaning Services — Professional Domestic Cleaning from £23/hour"
          className="w-full h-auto block md:rounded-2xl shadow-lg"
        />
      </div>
    </section>
  );
};

export default LandingHero;
