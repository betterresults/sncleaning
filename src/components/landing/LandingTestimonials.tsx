import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah M.',
    text: "We've been using SN Cleaning Services for over a year now and couldn't be happier. The team is always on time, thorough, and we love the photo reports after each clean.",
    rating: 5,
  },
  {
    name: 'James T.',
    text: "As an Airbnb host, consistency is everything. SN Cleaning Services' checklist system means every guest walks into a spotless property. Highly recommend!",
    rating: 5,
  },
  {
    name: 'Emily R.',
    text: "I was tired of unreliable cleaners. Since switching to SN Cleaning Services, I haven't had a single issue. Their supervisors actually check the work — it makes a real difference.",
    rating: 5,
  },
];

const LandingTestimonials = () => {
  return (
    <section className="bg-[#faf5ea] py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block h-px w-12 bg-[#c9a84c] mb-5" />
          <h2
            className="text-3xl md:text-4xl font-semibold text-[#0d1b3d] tracking-wide uppercase"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            What Our Clients Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white p-7 shadow-sm border border-[#c9a84c]/25"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-[#c9a84c] text-[#c9a84c]" />
                ))}
              </div>
              <p className="text-[#0d1b3d]/80 text-sm leading-relaxed mb-4">{t.text}</p>
              <p className="font-semibold text-[#0d1b3d] text-sm tracking-wide">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;
