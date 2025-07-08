import React from 'react';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Logo */}
      <div className="mb-8 animate-scale-in">
        <img 
          src="/sn-cleaning-logo.png" 
          alt="SN Cleaning Services" 
          className="h-32 w-auto"
        />
      </div>
      
      {/* Tagline */}
      <div className="text-center space-y-2 animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: '#185166' }}>
          SN Cleaning Services
        </h1>
        <p className="text-lg" style={{ color: '#18A5A5' }}>
          You name it - We clean it
        </p>
      </div>
      
      {/* Loading indicator */}
      <div className="mt-12 flex items-center space-x-2 animate-fade-in">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#18A5A5' }}></div>
        <div className="w-2 h-2 rounded-full animate-pulse delay-75" style={{ backgroundColor: '#18A5A5' }}></div>
        <div className="w-2 h-2 rounded-full animate-pulse delay-150" style={{ backgroundColor: '#18A5A5' }}></div>
      </div>
      
      {/* Professional message */}
      <div className="absolute bottom-12 text-center animate-fade-in">
        <p className="text-sm text-gray-600">
          Professional • Reliable • Trusted
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;