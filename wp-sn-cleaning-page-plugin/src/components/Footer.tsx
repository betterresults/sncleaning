import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import snLogo from '@/assets/sn-cleaning-logo-new.png';
import { trackClick } from '@/utils/analytics';

interface FooterProps {
  className?: string;
  variant?: 'default' | 'dark';
}

const Footer: React.FC<FooterProps> = ({ className = '', variant = 'default' }) => {
  const baseClasses = variant === 'dark' 
    ? 'bg-foreground text-background' 
    : 'bg-muted text-foreground';

  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${baseClasses} ${className}`}>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center">
              <img 
                src={snLogo} 
                alt="SN Cleaning Services" 
                className="h-16 w-auto"
              />
            </div>
            <p className={`text-sm leading-relaxed ${variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'}`}>
              Professional cleaning services across London and Essex. We guarantee exceptional results with our comprehensive cleaning solutions for residential and commercial properties.
            </p>
            <div className="flex space-x-4">
              <a 
                href="tel:+442038355033" 
                className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                  variant === 'dark' 
                    ? 'bg-background/10 hover:bg-background/20 text-background/80 hover:text-background' 
                    : 'bg-white hover:bg-primary/10 text-muted-foreground hover:text-primary shadow-sm'
                }`}
                aria-label="Call us"
                onClick={() => trackClick('phone_icon_click', 'footer', 'Phone icon clicked', 'tel:+442038355033')}
              >
                <Phone className="w-5 h-5" />
              </a>
              <a 
                href="https://wa.me/442038355033" 
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                  variant === 'dark' 
                    ? 'bg-background/10 hover:bg-background/20 text-background/80 hover:text-background' 
                    : 'bg-white hover:bg-primary/10 text-muted-foreground hover:text-primary shadow-sm'
                }`}
                aria-label="WhatsApp us"
                onClick={() => trackClick('whatsapp_icon_click', 'footer', 'WhatsApp icon clicked', 'https://wa.me/442038355033')}
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a 
                href="mailto:info@sncleaningservices.co.uk" 
                className={`p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                  variant === 'dark' 
                    ? 'bg-background/10 hover:bg-background/20 text-background/80 hover:text-background' 
                    : 'bg-white hover:bg-primary/10 text-muted-foreground hover:text-primary shadow-sm'
                }`}
                aria-label="Email us"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
                onClick={() => trackClick('nav_home', 'footer', 'Home link clicked', '/')}
              >
                Home
              </Link>
              <Link 
                to="/about" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                About Us
              </Link>
              <Link 
                to="/faqs" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                FAQs
              </Link>
              <Link 
                to="/quote" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                Get Quote
              </Link>
              <Link 
                to="/contact" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Our Services</h3>
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/services/end-of-tenancy" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                End of Tenancy Cleaning
              </Link>
              <Link 
                to="/services/domestic-cleaning" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                Domestic Cleaning
              </Link>
              <Link 
                to="/services/deep-cleaning" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                Deep Cleaning
              </Link>
              <Link 
                to="/services/carpet-cleaning" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                Carpet Cleaning
              </Link>
              <Link 
                to="/services/oven-cleaning" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                Oven Cleaning
              </Link>
              <Link 
                to="/services/commercial-cleaning" 
                className={`transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                }`}
              >
                Commercial Cleaning
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Get In Touch</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className={`mt-1 p-2 rounded-lg ${
                  variant === 'dark' ? 'bg-background/10' : 'bg-white shadow-sm'
                }`}>
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Phone</div>
                  <a 
                    href="tel:+442038355033" 
                    className={`transition-colors duration-200 hover:text-primary ${
                      variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                    }`}
                  >
                    020 3835 5033
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className={`mt-1 p-2 rounded-lg ${
                  variant === 'dark' ? 'bg-background/10' : 'bg-white shadow-sm'
                }`}>
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Email</div>
                  <a 
                    href="mailto:info@sncleaningservices.co.uk" 
                    className={`transition-colors duration-200 hover:text-primary ${
                      variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'
                    }`}
                  >
                    info@sncleaningservices.co.uk
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className={`mt-1 p-2 rounded-lg ${
                  variant === 'dark' ? 'bg-background/10' : 'bg-white shadow-sm'
                }`}>
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">Service Area</div>
                  <div className={`${variant === 'dark' ? 'text-background/80' : 'text-muted-foreground'}`}>
                    London & Essex
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link 
                  to="/quote" 
                  className="inline-block w-full text-center bg-gradient-to-r from-primary to-primary-light text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  onClick={() => trackClick('get_quote_click', 'footer', 'Get Free Quote button clicked', '/quote')}
                >
                  Get Free Quote
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-12 pt-8 border-t ${
          variant === 'dark' ? 'border-background/20' : 'border-border'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className={`text-sm ${variant === 'dark' ? 'text-background/60' : 'text-muted-foreground'}`}>
              Copyright © 2025 SN Core LTD. All Rights Reserved. Company Number 15912581
            </div>
            <div className="flex space-x-6">
              <Link 
                to="/privacy" 
                className={`text-sm transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/60' : 'text-muted-foreground'
                }`}
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className={`text-sm transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/60' : 'text-muted-foreground'
                }`}
              >
                Terms of Service
              </Link>
              <Link 
                to="/cookies" 
                className={`text-sm transition-colors duration-200 hover:text-primary ${
                  variant === 'dark' ? 'text-background/60' : 'text-muted-foreground'
                }`}
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;