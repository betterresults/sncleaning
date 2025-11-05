/**
 * SN Cleaning Theme JavaScript
 * @package SN_Cleaning
 */

(function() {
    'use strict';

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            
            mobileMenu.classList.toggle('hidden');
            
            // Toggle icons
            const menuIcon = this.querySelector('.menu-icon');
            const closeIcon = this.querySelector('.close-icon');
            if (menuIcon && closeIcon) {
                menuIcon.classList.toggle('hidden');
                closeIcon.classList.toggle('hidden');
            }
        });
    }

    // Analytics Tracking
    const trackEvent = function(category, action, label, value) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label,
                'value': value
            });
        }
        
        // Also log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Track:', category, action, label, value);
        }
    };

    // Track all external links
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Track external links
        if (href.startsWith('http') && !href.includes(window.location.hostname)) {
            trackEvent('Outbound Link', 'click', href);
        }
        
        // Track phone links
        if (href.startsWith('tel:')) {
            trackEvent('Phone', 'click', href.replace('tel:', ''));
        }
        
        // Track email links
        if (href.startsWith('mailto:')) {
            trackEvent('Email', 'click', href.replace('mailto:', ''));
        }
        
        // Track WhatsApp links
        if (href.includes('wa.me')) {
            trackEvent('WhatsApp', 'click', href);
        }
        
        // Track booking links
        if (href.includes('book.sncleaningservices')) {
            trackEvent('Booking', 'click', 'Get Quote Button');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation classes on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-slide-up');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-fade-in, .card-feature, .service-card').forEach(el => {
        observer.observe(el);
    });

    // Sticky header on scroll
    let lastScrollTop = 0;
    const header = document.getElementById('site-header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                header.classList.add('shadow-md');
            } else {
                header.classList.remove('shadow-md');
            }
            
            lastScrollTop = scrollTop;
        }, { passive: true });
    }

})();
