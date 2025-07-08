import React from 'react';

const SplashScreen = () => {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ 
        background: `linear-gradient(135deg, #18A5A5 0%, #185166 100%)` 
      }}
    >
      {/* Main content */}
      <div className="text-center">
        {/* Logo in white container - exactly like the reference */}
        <div className="mb-16 transform animate-scale-in">
          <div className="bg-white rounded-3xl p-12 shadow-2xl mx-auto inline-block">
            <img 
              src="/sn-cleaning-logo.png" 
              alt="SN Cleaning Services" 
              className="h-20 w-auto"
            />
          </div>
        </div>
        
        {/* Client-focused messaging that builds trust */}
        <div className="space-y-8 animate-fade-in delay-300">
          <h1 className="text-3xl font-light text-white tracking-wider">
            PROFESSIONAL CLEANING
          </h1>
          <div className="w-16 h-0.5 bg-white/60 mx-auto"></div>
          <h2 className="text-xl font-light text-white/90 tracking-wide">
            YOU CAN TRUST
          </h2>
        </div>
        
        {/* Reassuring tagline */}
        <div className="mt-16 animate-fade-in delay-500">
          <p className="text-lg text-white/80 font-light italic">
            "Your home is in safe hands"
          </p>
        </div>
      </div>
      
      {/* Loading dots */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-fade-in delay-700">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;