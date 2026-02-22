import { useEffect } from 'react';
import LandingHero from '@/components/landing/LandingHero';
import LandingVideoPlaceholder from '@/components/landing/LandingVideoPlaceholder';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingReasons from '@/components/landing/LandingReasons';

const LandingPage = () => {
  useEffect(() => {
    // Capture UTM params on landing
    const params = new URLSearchParams(window.location.search);
    const utmParams = {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_term: params.get('utm_term') || null,
      utm_content: params.get('utm_content') || null,
    };

    if (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) {
      localStorage.setItem('quote_utm_params', JSON.stringify(utmParams));
      localStorage.setItem('quote_source', utmParams.utm_source?.toLowerCase() || 'landing_page');
    } else if (!localStorage.getItem('quote_source')) {
      const referrer = document.referrer;
      if (referrer) {
        try {
          const hostname = new URL(referrer).hostname.toLowerCase();
          if (!hostname.includes('sncleaningservices') && !hostname.includes('lovable')) {
            let source = 'website';
            if (hostname.includes('google')) source = 'google';
            else if (hostname.includes('facebook') || hostname.includes('fb.com')) source = 'facebook';
            else if (hostname.includes('instagram')) source = 'instagram';
            else if (hostname.includes('tiktok')) source = 'tiktok';
            localStorage.setItem('quote_source', source);
          }
        } catch {}
      }
      if (!localStorage.getItem('quote_source')) {
        localStorage.setItem('quote_source', 'direct');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <LandingHero />
      <LandingVideoPlaceholder />
      <LandingCTA />
      <LandingTestimonials />
      <LandingReasons />
      <LandingCTA />

      {/* Footer */}
      <footer className="bg-[#185166] text-white/70 text-center py-6 text-sm">
        © {new Date().getFullYear()} SN Cleaning Services. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
