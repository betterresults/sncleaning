import React from 'react';

const SplashScreen = () => {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ 
        background: `linear-gradient(135deg, #18A5A5 0%, #185166 100%)` 
      }}
    >
      {/* Geometric background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full border border-white/20"></div>
        <div className="absolute top-40 right-32 w-24 h-24 rounded-full border border-white/20"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 rounded-full border border-white/20"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 rounded-full border border-white/20"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo container with elegant shadow */}
        <div className="mb-12 transform animate-scale-in">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
              <img 
                src="/sn-cleaning-logo.png" 
                alt="SN Cleaning Services" 
                className="h-24 w-auto mx-auto"
              />
            </div>
          </div>
        </div>
        
        {/* Professional typography */}
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-4xl font-light text-white tracking-wide">
            SN CLEANING
          </h1>
          <div className="w-24 h-0.5 bg-white/60 mx-auto"></div>
          <p className="text-xl font-light text-white/90 tracking-wider">
            SERVICES
          </p>
        </div>
        
        {/* Elegant tagline */}
        <div className="mt-12 animate-fade-in delay-300">
          <p className="text-lg text-white/80 font-light italic">
            "You name it - We clean it"
          </p>
        </div>
      </div>
      
      {/* Professional loading indicator */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-fade-in delay-500">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;