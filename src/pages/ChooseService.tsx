import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building, Home, Users, Droplets, HardHat, Layers, Sparkles, ArrowRight } from 'lucide-react';
import { useFunnelTracking } from '@/hooks/useFunnelTracking';

// Capture and store UTM params and source on first landing - this is critical!
const captureTrackingParams = () => {
  const params = new URLSearchParams(window.location.search);
  const utmParams = {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_term: params.get('utm_term') || null,
    utm_content: params.get('utm_content') || null,
  };
  
  // Always store if we have UTM params (overwrite any stale data from previous sessions)
  if (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) {
    localStorage.setItem('quote_utm_params', JSON.stringify(utmParams));
    localStorage.setItem('quote_source', utmParams.utm_source?.toLowerCase() || 'website');
    console.log('📊 ChooseService: Captured UTM params:', utmParams);
  } else {
    // Determine source from referrer if no UTM params
    const referrer = document.referrer;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const hostname = referrerUrl.hostname.toLowerCase();
        
        // Skip self-referrals
        if (!hostname.includes('sncleaningservices') && 
            !hostname.includes('lovable') && 
            !hostname.includes('lovableproject')) {
          
          let source = 'website';
          if (hostname.includes('google')) source = 'google';
          else if (hostname.includes('facebook') || hostname.includes('fb.com') || hostname.includes('m.facebook')) source = 'facebook';
          else if (hostname.includes('instagram')) source = 'instagram';
          else if (hostname.includes('tiktok')) source = 'tiktok';
          else if (hostname.includes('twitter') || hostname.includes('x.com')) source = 'twitter';
          else if (hostname.includes('linkedin')) source = 'linkedin';
          else if (hostname.includes('bing')) source = 'bing';
          else if (hostname.includes('yahoo')) source = 'yahoo';
          else if (hostname.includes('pinterest')) source = 'pinterest';
          else if (hostname.includes('youtube')) source = 'youtube';
          else if (hostname.includes('nextdoor')) source = 'nextdoor';
          else source = hostname.replace('www.', '').replace('m.', '');
          
          localStorage.setItem('quote_source', source);
          console.log('📊 ChooseService: Source from referrer:', source);
        }
      } catch {
        // Invalid referrer URL
      }
    }
    
    // If no source stored yet and no referrer, it's direct
    if (!localStorage.getItem('quote_source')) {
      localStorage.setItem('quote_source', 'direct');
      console.log('📊 ChooseService: Direct traffic');
    }
  }
  
  // Store the original landing URL with all params for reference
  if (!localStorage.getItem('quote_original_landing_url')) {
    localStorage.setItem('quote_original_landing_url', window.location.href);
    console.log('📊 ChooseService: Stored original landing URL:', window.location.href);
  }
};

const services = [
  {
    id: 'domestic-cleaning',
    title: 'Domestic Cleaning',
    icon: Home,
    available: true,
    description: 'Regular home cleaning services',
    gradient: 'from-[#185166] to-[#0f3a4a]'
  },
  {
    id: 'airbnb-cleaning',
    title: 'Airbnb Cleaning',
    icon: Building,
    available: true,
    description: 'Turnaround cleaning for short-term rentals',
    gradient: 'from-[#18A5A5] to-[#185166]'
  },
  {
    id: 'end-of-tenancy',
    title: 'End Of Tenancy Cleaning',
    icon: Users,
    available: false,
    description: 'Deep clean for move-out properties',
    gradient: 'from-gray-400 to-gray-500'
  },
  {
    id: 'deep-cleaning',
    title: 'Deep Cleaning',
    icon: Droplets,
    available: false,
    description: 'Thorough cleaning for all areas',
    gradient: 'from-gray-400 to-gray-500'
  },
  {
    id: 'after-builders',
    title: 'After Builders Cleaning',
    icon: HardHat,
    available: false,
    description: 'Post-construction cleanup',
    gradient: 'from-gray-400 to-gray-500'
  },
  {
    id: 'carpet-cleaning',
    title: 'Carpet Cleaning',
    icon: Layers,
    available: false,
    description: 'Professional carpet deep cleaning',
    gradient: 'from-gray-400 to-gray-500'
  }
];

const ChooseService = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postcode = searchParams.get('postcode') || '';
  const email = searchParams.get('email') || '';
  const { trackPageView, trackServiceClick } = useFunnelTracking();

  // Capture tracking params IMMEDIATELY on mount - before anything else
  useEffect(() => {
    captureTrackingParams();
    console.log('🎯 ChooseService: Tracking page view for /services');
    trackPageView('services_page', { postcode });
  }, []);

  const handleServiceSelect = (serviceId: string) => {
    console.log('🎯 ChooseService: Tracking service click:', serviceId);
    trackServiceClick(serviceId, serviceId.replace(/-/g, ' '));
    
    sessionStorage.setItem('selectedService', serviceId);
    sessionStorage.setItem('bookingPostcode', postcode);
    sessionStorage.setItem('bookingEmail', email);

    if (serviceId === 'airbnb-cleaning') {
      navigate(`/airbnb?postcode=${encodeURIComponent(postcode)}&email=${encodeURIComponent(email)}`);
      return;
    }

    if (serviceId === 'domestic-cleaning') {
      navigate(`/domestic?postcode=${encodeURIComponent(postcode)}&email=${encodeURIComponent(email)}`);
      return;
    }

    navigate(`/auth?service=${serviceId}&postcode=${encodeURIComponent(postcode)}&email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#e0f2f1] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#18A5A5]/10 text-[#18A5A5] px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Professional Cleaning Services
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#185166] mb-4">
            {postcode ? `Services in ${postcode}` : 'Our Services'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the cleaning service that best fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const IconComponent = service.icon;
            
            return (
              <div
                key={service.id}
                onClick={() => service.available && handleServiceSelect(service.id)}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${
                  service.available 
                    ? 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl' 
                    : 'cursor-not-allowed opacity-60'
                }`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-90`} />
                
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                  }} />
                </div>

                {/* Content */}
                <div className="relative p-8 h-64 flex flex-col justify-between">
                  <div>
                    <div className={`inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-4 ${
                      service.available ? 'group-hover:bg-white/30 transition-colors duration-300' : ''
                    }`}>
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {service.available && (
                    <div className="flex items-center gap-2 text-white/90 text-sm font-medium group-hover:text-white transition-colors">
                      <span>Get Instant Quote</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </div>

                {/* Hover glow effect for available services */}
                {service.available && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChooseService;
