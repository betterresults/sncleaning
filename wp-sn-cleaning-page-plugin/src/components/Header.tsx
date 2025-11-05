import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, ChevronDown } from 'lucide-react';
import snLogo from '@/assets/sn-cleaning-logo-new.png';
import { trackClick } from '@/utils/analytics';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  variant?: 'default' | 'transparent';
}

const Header: React.FC<HeaderProps> = ({ className = '', variant = 'default' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const baseClasses = variant === 'transparent' 
    ? 'fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-white/20' 
    : 'bg-white border-b border-border';

  return (
    <header className={`${baseClasses} ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center hover:opacity-90 transition-all duration-300"
            onClick={() => trackClick('logo_click', 'header', 'Logo navigation to home')}
          >
            <img 
              src={snLogo} 
              alt="SN Cleaning Services" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="space-x-6">
              <NavigationMenuItem>
                <Link 
                  to="/" 
                  className={cn(navigationMenuTriggerStyle(), "text-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300 bg-transparent text-base")}
                  onClick={() => trackClick('nav_home', 'header', 'Home navigation')}
                >
                  Home
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  className="text-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300 bg-transparent text-base"
                  onClick={() => trackClick('nav_services_dropdown', 'header', 'Services dropdown opened')}
                >
                  Services
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[280px] p-4 bg-background border border-border rounded-lg shadow-lg">
                    <div className="grid gap-1">
                      <NavigationMenuLink asChild>
                        <Link
                          to="/services/end-of-tenancy"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                          onClick={() => trackClick('service_click', 'header', 'End Of Tenancy Cleaning', '/services/end-of-tenancy')}
                        >
                          End Of Tenancy Cleaning
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/services/after-builders"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          After Builders Cleaning
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/services/domestic"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Domestic Cleaning
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/services/airbnb"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Airbnb Cleaning
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/services/deep-house"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Deep House Cleaning
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/services/carpet"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Carpet Cleaning Services
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/services/office"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Office Cleaning
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/services/school"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          School Cleaning
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/services/nursery"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Nursery Cleaning
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300 bg-transparent text-base">
                  About Us
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[200px] p-4 bg-background border border-border rounded-lg shadow-lg">
                    <div className="grid gap-1">
                      <NavigationMenuLink asChild>
                        <Link
                          to="/contact"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Contact Us
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/accreditation"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Accreditation
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/about"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          About Us
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/testimonials"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Testimonials
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/our-work"
                          className="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors"
                        >
                          Our Work
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link 
                  to="/faqs" 
                  className={cn(navigationMenuTriggerStyle(), "text-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300 bg-transparent text-base")}
                >
                  FAQs
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <a 
              href="https://book.sncleaningservices.co.uk" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-dark text-white hover:text-gray-300 px-7 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-300"
              onClick={() => trackClick('get_quote_click', 'header', 'Get Free Quote button', 'https://book.sncleaningservices.co.uk')}
            >
              Get Free Quote
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground hover:text-primary transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg 
              className={`w-6 h-6 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen 
            ? 'max-h-screen opacity-100 pb-6' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <nav className="flex flex-col space-y-4 pt-4 border-t border-border">
            <Link 
              to="/" 
              className="text-foreground hover:text-primary font-semibold transition-colors duration-300 py-3"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/services" 
              className="text-foreground hover:text-primary font-semibold transition-colors duration-300 py-3"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link 
              to="/about" 
              className="text-foreground hover:text-primary font-semibold transition-colors duration-300 py-3"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
            <Link 
              to="/faqs" 
              className="text-foreground hover:text-primary font-semibold transition-colors duration-300 py-3"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQs
            </Link>
            
            {/* Mobile CTA */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex gap-3">
                <a 
                  href="tel:+442038355033" 
                  className="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground py-3 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
                <a 
                  href="https://wa.me/442038355033" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground py-3 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
              <a 
                href="https://book.sncleaningservices.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-primary-dark text-white hover:text-gray-300 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Get Free Quote
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;