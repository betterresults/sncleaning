import { CheckCircle, MessageCircle, Mail, Phone } from 'lucide-react';

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

    <div className="mt-5 pt-5 border-t border-white/20">
      <p className="text-sm font-semibold text-white text-center mb-4">Get in touch:</p>
      <div className="grid grid-cols-3 gap-3">
        <a
          href="https://api.whatsapp.com/send?phone=442038355033&text=Hi%2C%20I%20just%20booked%20a%20cleaning%20service"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl py-4 px-2 transition-colors"
        >
          <MessageCircle className="h-7 w-7 text-[#25D366]" />
          <span className="text-xs font-medium text-white">WhatsApp</span>
        </a>
        <a
          href="mailto:info@sncleaningservices.co.uk"
          className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl py-4 px-2 transition-colors"
        >
          <Mail className="h-7 w-7 text-[#7EDFD6]" />
          <span className="text-xs font-medium text-white">Email</span>
        </a>
        <a
          href="tel:+442038355033"
          className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl py-4 px-2 transition-colors"
        >
          <Phone className="h-7 w-7 text-[#7EDFD6]" />
          <span className="text-xs font-medium text-white">Call</span>
        </a>
      </div>
    </div>
  </div>
);

export default WhatsNextSection;
