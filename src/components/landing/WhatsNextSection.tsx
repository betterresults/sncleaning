import { CheckCircle } from 'lucide-react';

const WhatsNextSection = () => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
    <h3 className="font-bold text-white mb-1 text-xl">Payment received. You're booked in.</h3>
    <p className="text-white/70 mb-5">Thanks for signing up with SN Cleaning Services. Here's what happens next:</p>
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-[#7EDFD6] flex-shrink-0 mt-0.5" />
        <span className="text-sm text-white/90">We review your booking details and get in touch if we need any additional information</span>
      </div>
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-[#7EDFD6] flex-shrink-0 mt-0.5" />
        <span className="text-sm text-white/90">Your dedicated supervisor is assigned on site for your property</span>
      </div>
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-[#7EDFD6] flex-shrink-0 mt-0.5" />
        <span className="text-sm text-white/90">Sit back, relax, and meet your cleaner on your chosen date and time</span>
      </div>
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-[#7EDFD6] flex-shrink-0 mt-0.5" />
        <span className="text-sm text-white/90">After each clean, photo reports are sent and quality is monitored internally</span>
      </div>
    </div>

    <p className="text-sm text-white/70 mt-5">If you need to change anything, it's easy. Message us and we'll update your plan.</p>

    <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
      <p className="text-sm font-semibold text-white">Get in touch:</p>
      <div className="flex flex-col gap-1.5 text-sm">
        <a href="https://wa.me/442038355033" target="_blank" rel="noopener noreferrer" className="text-[#7EDFD6] hover:underline inline-flex items-center gap-1">📱 WhatsApp: 0203 835 5033</a>
        <a href="mailto:info@sncleaningservices.co.uk" className="text-[#7EDFD6] hover:underline">✉️ info@sncleaningservices.co.uk</a>
        <a href="tel:+442038355033" className="text-[#7EDFD6] hover:underline">📞 0203 835 5033</a>
      </div>
    </div>
  </div>
);

export default WhatsNextSection;
