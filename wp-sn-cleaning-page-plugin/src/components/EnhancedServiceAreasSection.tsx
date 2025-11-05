import { MapPin, Clock, CheckCircle } from "lucide-react";

const EnhancedServiceAreasSection = () => {
  const londonAreas = [
    "South Hornchurch", "Hornchurch", "Upminster", "Rainham",
    "Elm Park", "Romford", "Gidea Park", "Harold Wood",
    "Harold Hill", "Emerson Park", "Cranham", "North Ockendon"
  ];

  const essexAreas = [
    "Brentwood", "Chelmsford", "Colchester", "Basildon",
    "Southend-on-Sea", "Harlow", "Braintree", "Maldon"
  ];

  return (
    <section className="section-padding bg-gradient-surface">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            Service Areas Across <span className="text-primary">London & Essex</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional cleaning services covering Greater London and Essex regions with fast response times
          </p>
        </div>

        {/* Map Background Visual */}
        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout - Stacked Cards */}
          <div className="block lg:hidden space-y-6">
            {/* London Coverage Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                <h3 className="text-xl font-bold text-foreground">London Coverage</h3>
              </div>
              <p className="text-lg font-semibold text-primary mb-2">All London areas within M25</p>
              <p className="text-sm text-muted-foreground">Complete coverage of Greater London</p>
            </div>

            {/* Essex Coverage Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 bg-accent rounded-full animate-pulse delay-500"></div>
                <h3 className="text-xl font-bold text-foreground">Essex Coverage</h3>
              </div>
              <p className="text-lg font-semibold text-accent mb-2">Essex areas</p>
              <p className="text-sm text-muted-foreground">Major towns and surrounding areas</p>
            </div>
          </div>

          {/* Desktop Layout - Map with Overlaid Cards */}
          <div className="hidden lg:block relative bg-white rounded-3xl p-8 shadow-lg overflow-hidden">
            {/* Map Background */}
            <div className="relative h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl overflow-hidden border-2 border-slate-200">
              {/* Map grid pattern to simulate map */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 400 300">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Map-like shapes for London and Essex */}
                  <g opacity="0.3">
                    {/* London area shape */}
                    <circle cx="120" cy="150" r="45" fill="#18A5A5" opacity="0.2"/>
                    <circle cx="130" cy="140" r="35" fill="#18A5A5" opacity="0.3"/>
                    <circle cx="110" cy="160" r="25" fill="#18A5A5" opacity="0.4"/>
                    
                    {/* Essex area shape */}
                    <ellipse cx="280" cy="120" rx="40" ry="50" fill="#185166" opacity="0.2"/>
                    <ellipse cx="290" cy="110" rx="30" ry="35" fill="#185166" opacity="0.3"/>
                    <ellipse cx="270" cy="130" rx="20" ry="25" fill="#185166" opacity="0.4"/>
                  </g>
                  
                  {/* Roads/connections */}
                  <path d="M 160 150 Q 200 140 240 120" stroke="#94a3b8" strokeWidth="3" fill="none" opacity="0.4"/>
                  <path d="M 140 170 Q 180 160 220 140" stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.3"/>
                </svg>
              </div>
              
              {/* London Coverage Area */}
              <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border max-w-xs">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                    <h3 className="text-xl font-bold text-foreground">London Coverage</h3>
                  </div>
                  <p className="text-lg font-semibold text-primary mb-2">All London areas within M25</p>
                  <p className="text-sm text-muted-foreground">Complete coverage of Greater London</p>
                </div>
              </div>

              {/* Essex Coverage Area */}
              <div className="absolute right-8 top-1/3 transform -translate-y-1/2">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border max-w-xs">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-accent rounded-full animate-pulse delay-500"></div>
                    <h3 className="text-xl font-bold text-foreground">Essex Coverage</h3>
                  </div>
                  <p className="text-lg font-semibold text-accent mb-2">Essex areas</p>
                  <p className="text-sm text-muted-foreground">Major towns and surrounding areas</p>
                </div>
              </div>

              {/* Connection line */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-20 h-0.5 bg-gradient-to-r from-primary to-accent animate-pulse delay-300"></div>
                  <div className="w-3 h-3 bg-accent rounded-full animate-pulse delay-500"></div>
                </div>
              </div>

              {/* Floating service indicators */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md animate-float">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Fast Response</span>
                </div>
              </div>
              
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md animate-float delay-1000">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium">Guaranteed</span>
                </div>
              </div>
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md animate-float delay-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">Full Coverage</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Promise */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 bg-white px-8 py-4 rounded-2xl shadow-md">
            <CheckCircle className="w-6 h-6 text-success" />
            <span className="text-lg font-semibold text-foreground">
              Same-day quotes • 24/7 availability • Fully insured
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedServiceAreasSection;