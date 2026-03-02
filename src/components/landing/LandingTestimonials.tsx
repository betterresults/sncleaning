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
    <section className="bg-[#f8fafa] py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#185166] text-center mb-10">
          What Our Clients Say
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{t.text}</p>
              <p className="font-semibold text-[#185166] text-sm">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;
