import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { ArrowRight, Loader2, Sparkles, Home, Building, Users, Layers, CheckCircle2 } from 'lucide-react';
import LandingTestimonials from '@/components/landing/LandingTestimonials';

const SUPABASE_URL = "https://dkomihipebixlegygnoy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4";

const services = [
  {
    id: 'domestic-cleaning',
    title: 'Domestic Cleaning',
    icon: Home,
    route: '/domestic',
    description: 'Regular home cleaning',
  },
  {
    id: 'airbnb-cleaning',
    title: 'Airbnb Cleaning',
    icon: Building,
    route: '/airbnb',
    description: 'Short-term rental turnaround',
  },
  {
    id: 'end-of-tenancy',
    title: 'End Of Tenancy',
    icon: Users,
    route: '/end-of-tenancy',
    description: 'Move-out deep clean',
  },
  {
    id: 'carpet-cleaning',
    title: 'Carpet Cleaning',
    icon: Layers,
    route: '/carpet-cleaning',
    description: 'Professional carpet care',
  },
];

const trustItems = [
  'Free Quote In Under 2 Minutes',
  'Trusted by London & Essex Homeowners',
  'Easy Support On WhatsApp',
];

const FreeQuote = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPostcode = postcode.trim();

    if (!trimmedName || !trimmedEmail || !phone || !trimmedPostcode) {
      setError('Please fill in all fields.');
      return;
    }

    if (!selectedService) {
      setError('Please select a service.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone.startsWith('+44') || phoneDigits.length !== 12) {
      setError('Please enter a valid UK phone number.');
      return;
    }

    if (trimmedPostcode.length < 5) {
      setError('Please enter a valid postcode.');
      return;
    }

    setSubmitting(true);

    try {
      const sessionId = crypto.randomUUID();
      localStorage.setItem('quote_session_id', sessionId);
      localStorage.setItem('quote_session_timestamp', Date.now().toString());

      const nameParts = trimmedName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const utmParams = JSON.parse(localStorage.getItem('quote_utm_params') || '{}');
      const source = localStorage.getItem('quote_source') || 'landing_page';

      await fetch(`${SUPABASE_URL}/functions/v1/track-funnel-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          table: 'quote_leads',
          data: {
            session_id: sessionId,
            first_name: firstName,
            last_name: lastName,
            email: trimmedEmail,
            phone: phone,
            postcode: trimmedPostcode,
            status: 'new',
            furthest_step: 'lead_captured',
            source: source,
            utm_source: utmParams.utm_source || null,
            utm_medium: utmParams.utm_medium || null,
            utm_campaign: utmParams.utm_campaign || null,
            utm_term: utmParams.utm_term || null,
            utm_content: utmParams.utm_content || null,
          },
        }),
      });

      // Store for downstream pages
      sessionStorage.setItem('selectedService', selectedService);
      sessionStorage.setItem('bookingPostcode', trimmedPostcode);
      sessionStorage.setItem('bookingEmail', trimmedEmail);

      // Navigate directly to the booking form
      const service = services.find(s => s.id === selectedService);
      const route = service?.route || '/services';
      navigate(`${route}?postcode=${encodeURIComponent(trimmedPostcode)}&email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err) {
      console.error('Error saving lead:', err);
      navigate(`/services?email=${encodeURIComponent(email.trim())}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#185166] via-[#1a5f75] to-[#18A5A5]">
      {/* Hero header */}
      <div className="pt-12 pb-6 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          Quick & Easy
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
          Get Your Free Quote
          <br />
          <span className="text-[#7EDFD6]">In Under 2 Minutes</span>
        </h1>
        <p className="text-white/80 text-base md:text-lg max-w-md mx-auto">
          Plus get <span className="font-bold text-white">10% off</span> your first clean when you book through our portal
        </p>
      </div>

      {/* Form card */}
      <div className="px-4 pb-12">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal details */}
            <div>
              <label className="block text-sm font-semibold text-[#185166] mb-1.5">Full Name</label>
              <Input
                type="text"
                placeholder="e.g. John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 text-base rounded-xl border-gray-200 focus:border-[#18A5A5]"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#185166] mb-1.5">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base rounded-xl border-gray-200 focus:border-[#18A5A5]"
                maxLength={255}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#185166] mb-1.5">Phone</label>
              <PhoneInput
                value={phone}
                onChange={(val) => setPhone(val)}
                placeholder="7123 456 789"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#185166] mb-1.5">Postcode</label>
              <Input
                type="text"
                placeholder="e.g. E1 6AN"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                className="h-12 text-base rounded-xl border-gray-200 focus:border-[#18A5A5]"
                maxLength={10}
              />
            </div>

            {/* Service selection */}
            <div>
              <label className="block text-sm font-semibold text-[#185166] mb-2">What do you need?</label>
              <div className="grid grid-cols-2 gap-3">
                {services.map((service) => {
                  const Icon = service.icon;
                  const isSelected = selectedService === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service.id)}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                        isSelected
                          ? 'border-[#18A5A5] bg-[#18A5A5]/10 shadow-md'
                          : 'border-gray-200 bg-gray-50 hover:border-[#18A5A5]/50'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${isSelected ? 'text-[#18A5A5]' : 'text-[#185166]/60'}`} />
                      <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-[#185166]' : 'text-[#185166]/70'}`}>
                        {service.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#18A5A5] hover:bg-[#159090] text-white font-bold text-lg h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 mt-2"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Get My Free Quote
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Trust badges */}
          <div className="mt-6 space-y-2">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[#185166]/80">
                <CheckCircle2 className="h-4 w-4 text-[#18A5A5] flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white">
        <LandingTestimonials />
      </div>
    </div>
  );
};

export default FreeQuote;
