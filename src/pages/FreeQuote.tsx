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
    <div className="min-h-screen bg-[#f5efe2]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Hero header */}
      <div className="pt-14 pb-8 px-4 text-center">
        <div className="inline-block h-px w-12 bg-[#c9a84c] mb-5" />
        <div className="inline-flex items-center gap-2 text-[#c9a84c] px-4 py-1 text-xs font-semibold mb-4 uppercase tracking-[0.25em]">
          <Sparkles className="h-3.5 w-3.5" />
          Quick & Easy
        </div>
        <h1
          className="text-3xl md:text-5xl font-semibold text-[#0d1b3d] mb-4 leading-tight uppercase tracking-wide"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Get Your Instant Quote
          <br />
          <span className="text-[#c9a84c]">In Under 2 Minutes</span>
        </h1>
        <p className="text-[#0d1b3d]/70 text-base md:text-lg max-w-md mx-auto">
          Fill in the short form below with a few details about your property and we'll generate your tailored, no-obligation price instantly — no calls, no waiting around.
        </p>
      </div>

      {/* Form card */}
      <div className="px-4 pb-12">
        <div className="max-w-lg mx-auto bg-white shadow-xl p-6 md:p-8 border border-[#c9a84c]/30">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal details */}
            <div>
              <label className="block text-xs font-semibold text-[#0d1b3d] mb-1.5 uppercase tracking-wider">Full Name</label>
              <Input
                type="text"
                placeholder="e.g. John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 text-base rounded-none border-gray-300 focus:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0d1b3d] mb-1.5 uppercase tracking-wider">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base rounded-none border-gray-300 focus:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                maxLength={255}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0d1b3d] mb-1.5 uppercase tracking-wider">Phone</label>
              <PhoneInput
                value={phone}
                onChange={(val) => setPhone(val)}
                placeholder="7123 456 789"
                className="rounded-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0d1b3d] mb-1.5 uppercase tracking-wider">Postcode</label>
              <Input
                type="text"
                placeholder="e.g. E1 6AN"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                className="h-12 text-base rounded-none border-gray-300 focus:border-[#c9a84c] focus-visible:ring-[#c9a84c]/30"
                maxLength={10}
              />
            </div>

            {/* Service selection */}
            <div>
              <label className="block text-xs font-semibold text-[#0d1b3d] mb-2 uppercase tracking-wider">What do you need?</label>
              <div className="grid grid-cols-2 gap-3">
                {services.map((service) => {
                  const Icon = service.icon;
                  const isSelected = selectedService === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service.id)}
                      className={`flex flex-col items-center gap-1.5 p-4 border transition-all duration-200 text-center ${
                        isSelected
                          ? 'border-[#c9a84c] bg-[#faf5ea] shadow-md'
                          : 'border-gray-200 bg-white hover:border-[#c9a84c]/60'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${isSelected ? 'text-[#c9a84c]' : 'text-[#0d1b3d]/60'}`} />
                      <span className={`text-xs font-semibold leading-tight uppercase tracking-wider ${isSelected ? 'text-[#0d1b3d]' : 'text-[#0d1b3d]/70'}`}>
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
              className="w-full flex items-center justify-center gap-2 bg-[#0d1b3d] hover:bg-[#0a1530] text-white font-semibold text-base h-14 rounded-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 mt-2 uppercase tracking-widest border-b-2 border-[#c9a84c]"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Get My Free Quote
                  <ArrowRight className="h-5 w-5 text-[#c9a84c]" />
                </>
              )}
            </button>
          </form>

          {/* Trust badges */}
          <div className="mt-6 space-y-2 pt-5 border-t border-[#c9a84c]/20">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[#0d1b3d]/80">
                <CheckCircle2 className="h-4 w-4 text-[#c9a84c] flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <LandingTestimonials />
    </div>
  );
};

export default FreeQuote;
