import { useEffect } from 'react';
import LandingHero from '@/components/landing/LandingHero';
import LandingVideoPlaceholder from '@/components/landing/LandingVideoPlaceholder';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingReasons from '@/components/landing/LandingReasons';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingServices from '@/components/landing/LandingServices';
import LandingFAQ from '@/components/landing/LandingFAQ';

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
    <div className="min-h-screen bg-[#f5efe2]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <LandingHero />
      <LandingVideoPlaceholder />
      <LandingCTA />
      <LandingHowItWorks />
      <LandingServices />
      <LandingTestimonials />
      <LandingReasons />
      <LandingFAQ />
      <LandingCTA />

      {/* Footer */}
      <footer className="bg-[#0d1b3d] text-[#f5efe2]/70 text-center py-8 text-sm tracking-widest border-t-2 border-[#c9a84c]">
        <div className="inline-block h-px w-10 bg-[#c9a84c] mb-3" />
        <div className="uppercase" style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '0.3em' }}>
          SN Cleaning Services
        </div>
        <div className="mt-2 text-xs">© {new Date().getFullYear()} All rights reserved.</div>
      </footer>
    </div>
  );
};

export default LandingPage;
