import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { ArrowRight, Loader2 } from 'lucide-react';

const SUPABASE_URL = "https://dkomihipebixlegygnoy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4";

const FreeQuoteForm = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [postcode, setPostcode] = useState('');
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

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Phone validation (must have +44 and 10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone.startsWith('+44') || phoneDigits.length !== 12) {
      setError('Please enter a valid UK phone number.');
      return;
    }

    // Basic postcode validation
    if (trimmedPostcode.length < 5) {
      setError('Please enter a valid postcode.');
      return;
    }

    setSubmitting(true);

    try {
      // Generate a session ID for tracking
      const sessionId = crypto.randomUUID();
      localStorage.setItem('quote_session_id', sessionId);
      localStorage.setItem('quote_session_timestamp', Date.now().toString());

      // Split name
      const nameParts = trimmedName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Get tracking data
      const utmParams = JSON.parse(localStorage.getItem('quote_utm_params') || '{}');
      const source = localStorage.getItem('quote_source') || 'landing_page';
      const landingUrl = localStorage.getItem('quote_original_landing_url') || window.location.href;

      // Save lead to quote_leads
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
            landing_page_url: landingUrl,
            utm_source: utmParams.utm_source || null,
            utm_medium: utmParams.utm_medium || null,
            utm_campaign: utmParams.utm_campaign || null,
            utm_term: utmParams.utm_term || null,
            utm_content: utmParams.utm_content || null,
          },
        }),
      });

      // Navigate to services page with params
      navigate(`/services?email=${encodeURIComponent(trimmedEmail)}&postcode=${encodeURIComponent(trimmedPostcode)}`);
    } catch (err) {
      console.error('Error saving lead:', err);
      // Still navigate even if tracking fails
      navigate(`/services?email=${encodeURIComponent(email.trim())}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <Input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-12 text-base rounded-xl border-gray-200 focus:border-[#18A5A5]"
          maxLength={100}
          required
        />
      </div>
      <div>
        <Input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 text-base rounded-xl border-gray-200 focus:border-[#18A5A5]"
          maxLength={255}
          required
        />
      </div>
      <div>
        <PhoneInput
          value={phone}
          onChange={(val) => setPhone(val)}
          placeholder="7123 456 789"
          className="rounded-xl"
        />
      </div>
      <div>
        <Input
          type="text"
          placeholder="Postcode"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value.toUpperCase())}
          className="h-12 text-base rounded-xl border-gray-200 focus:border-[#18A5A5]"
          maxLength={10}
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-[#18A5A5] hover:bg-[#159090] text-white font-bold text-lg h-14 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Next
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  );
};

export default FreeQuoteForm;
