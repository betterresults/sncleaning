import { useState, useRef, useEffect } from 'react';
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

  // Ensure we reuse the same session_id across partial + final saves
  const sessionIdRef = useRef<string>('');
  if (!sessionIdRef.current) {
    const existing = typeof window !== 'undefined' ? localStorage.getItem('quote_session_id') : null;
    sessionIdRef.current = existing || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quote_session_id', sessionIdRef.current);
      if (!localStorage.getItem('quote_session_timestamp')) {
        localStorage.setItem('quote_session_timestamp', Date.now().toString());
      }
    }
  }

  // Build the partial-lead payload from current field state
  const buildLeadPayload = (overrides: Partial<{ fullName: string; email: string; phone: string; postcode: string; furthestStep: string }> = {}) => {
    const n = (overrides.fullName ?? fullName).trim();
    const e = (overrides.email ?? email).trim();
    const p = overrides.phone ?? phone;
    const pc = (overrides.postcode ?? postcode).trim();
    const nameParts = n.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const utmParams = JSON.parse(localStorage.getItem('quote_utm_params') || '{}');
    const source = localStorage.getItem('quote_source') || 'landing_page';

    return {
      session_id: sessionIdRef.current,
      first_name: firstName || null,
      last_name: lastName || null,
      email: e || null,
      phone: p || null,
      postcode: pc || null,
      status: 'new',
      furthest_step: overrides.furthestStep || 'lead_partial',
      source,
      utm_source: utmParams.utm_source || null,
      utm_medium: utmParams.utm_medium || null,
      utm_campaign: utmParams.utm_campaign || null,
      utm_term: utmParams.utm_term || null,
      utm_content: utmParams.utm_content || null,
    };
  };

  // Save partial lead (on blur). Requires at least one of email/phone to avoid empty rows.
  const savePartial = async (overrides?: Partial<{ fullName: string; email: string; phone: string; postcode: string }>) => {
    const payload = buildLeadPayload(overrides);
    if (!payload.email && !payload.phone) return; // nothing useful yet
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/track-funnel-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ table: 'quote_leads', data: payload }),
        keepalive: true,
      });
    } catch (err) {
      console.warn('Partial lead save failed:', err);
    }
  };

  // Final fallback: capture lead on page unload via sendBeacon
  useEffect(() => {
    const handler = () => {
      const payload = buildLeadPayload({ furthestStep: 'lead_abandoned' });
      if (!payload.email && !payload.phone) return;
      try {
        const body = JSON.stringify({ table: 'quote_leads', data: payload });
        const blob = new Blob([body], { type: 'application/json' });
        // sendBeacon doesn't allow custom headers, so use fetch with keepalive
        fetch(`${SUPABASE_URL}/functions/v1/track-funnel-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };
    window.addEventListener('pagehide', handler);
    return () => window.removeEventListener('pagehide', handler);
  });

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
      // Reuse the same session ID created for partial saves so we update the same row
      const sessionId = sessionIdRef.current;
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
          onBlur={() => savePartial()}
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
          onBlur={() => savePartial()}
          className="h-12 text-base rounded-xl border-gray-200 focus:border-[#18A5A5]"
          maxLength={255}
          required
        />
      </div>
      <div onBlur={() => savePartial()}>
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
          onBlur={() => savePartial()}
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
