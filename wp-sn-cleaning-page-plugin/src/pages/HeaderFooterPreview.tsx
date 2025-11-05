import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HeaderFooterPreview = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center bg-white pt-20">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground">
            Your Page Content Here
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            This space represents where your main page content would be placed between the header and footer components.
          </p>
        </div>
      </main>
      
      {/* Footer */}
      <Footer variant="dark" />
    </div>
  );
};

export default HeaderFooterPreview;