<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
    <style>
        .container{max-width:1200px;margin:0 auto;padding:0 1rem;}
        .dropdown{position:relative;display:inline-block;}
        .dropdown-content{display:none;position:absolute;background-color:hsl(var(--background));border:1px solid hsl(var(--border));border-radius:0.5rem;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);z-index:50;top:100%;left:0;padding:1rem;}
        .dropdown:hover .dropdown-content{display:block;}
        .mobile-menu{display:none;flex-direction:column;padding-top:1rem;border-top:1px solid hsl(var(--border));}
        .mobile-menu.active{display:flex;}
        @media (max-width:1023px){.desktop-nav{display:none;}.mobile-toggle{display:block;}}
        @media (min-width:1024px){.desktop-nav{display:flex;}.mobile-toggle{display:none;}}
    </style>
</head>

<body <?php body_class(); ?>>

<header class="bg-white border-b border-border">
    <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16 lg:h-20">
            <!-- Logo -->
            <a href="<?php echo esc_url(home_url('/')); ?>" 
               class="flex items-center hover:opacity-90 transition-all duration-300">
                <?php if (has_custom_logo()) :
                    the_custom_logo();
                else : ?>
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/images/sn-cleaning-logo-new.png" 
                         alt="SN Cleaning Services" 
                         class="h-12 w-auto">
                <?php endif; ?>
            </a>

            <!-- Desktop Navigation -->
            <nav class="desktop-nav hidden lg:flex items-center space-x-6">
                <a href="<?php echo esc_url(home_url('/')); ?>" 
                   class="text-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300 bg-transparent text-base px-4 py-2 rounded-md">
                    Home
                </a>
                
                <div class="dropdown">
                    <button class="text-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300 bg-transparent text-base px-4 py-2 rounded-md flex items-center">
                        Services
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div class="dropdown-content w-[280px]">
                        <div class="grid gap-1">
                            <a href="<?php echo esc_url(home_url('/services/end-of-tenancy')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                End Of Tenancy Cleaning
                            </a>
                            <a href="<?php echo esc_url(home_url('/services/after-builders')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                After Builders Cleaning
                            </a>
                            <a href="<?php echo esc_url(home_url('/services/domestic')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                Domestic Cleaning
                            </a>
                            <a href="<?php echo esc_url(home_url('/services/airbnb')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                Airbnb Cleaning
                            </a>
                            <a href="<?php echo esc_url(home_url('/services/deep-house')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                Deep House Cleaning
                            </a>
                            <a href="<?php echo esc_url(home_url('/services/carpet')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                Carpet Cleaning Services
                            </a>
                            <a href="<?php echo esc_url(home_url('/services/office')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                Office Cleaning
                            </a>
                            <a href="<?php echo esc_url(home_url('/services/school')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                School Cleaning
                            </a>
                            <a href="<?php echo esc_url(home_url('/services/nursery')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                Nursery Cleaning
                            </a>
                        </div>
                    </div>
                </div>

                <div class="dropdown">
                    <button class="text-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300 bg-transparent text-base px-4 py-2 rounded-md flex items-center">
                        About
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div class="dropdown-content w-[200px]">
                        <div class="grid gap-1">
                            <a href="<?php echo esc_url(home_url('/about')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                About Us
                            </a>
                            <a href="<?php echo esc_url(home_url('/contact')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                Contact Us
                            </a>
                            <a href="<?php echo esc_url(home_url('/testimonials')); ?>" 
                               class="block px-4 py-3 text-base font-medium text-foreground hover:bg-foreground hover:text-background rounded-md transition-colors">
                                Testimonials
                            </a>
                        </div>
                    </div>
                </div>

                <a href="<?php echo esc_url(home_url('/faqs')); ?>" 
                   class="text-foreground hover:bg-foreground hover:text-background font-semibold transition-all duration-300 bg-transparent text-base px-4 py-2 rounded-md">
                    FAQs
                </a>
            </nav>

            <!-- CTA Buttons -->
            <div class="hidden lg:flex items-center space-x-4">
                <a href="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" 
                   target="_blank"
                   rel="noopener noreferrer"
                   class="bg-primary-dark text-white hover:text-gray-300 px-7 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-300">
                    Get Free Quote
                </a>
            </div>

            <!-- Mobile Menu Button -->
            <button class="mobile-toggle lg:hidden p-2 text-foreground hover:text-primary transition-colors duration-200"
                    onclick="toggleMobileMenu()"
                    aria-label="Toggle menu">
                <svg class="w-6 h-6 transition-transform duration-200" 
                     id="menu-icon"
                     fill="none" 
                     stroke="currentColor" 
                     viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
        </div>

        <!-- Mobile Navigation -->
        <div class="mobile-menu lg:hidden transition-all duration-300 ease-in-out" id="mobile-menu">
            <nav class="flex flex-col space-y-4 pt-4 border-t border-border">
                <a href="<?php echo esc_url(home_url('/')); ?>" 
                   class="text-foreground hover:text-primary font-semibold transition-colors duration-300 py-3">
                    Home
                </a>
                <a href="<?php echo esc_url(home_url('/services')); ?>" 
                   class="text-foreground hover:text-primary font-semibold transition-colors duration-300 py-3">
                    Services
                </a>
                <a href="<?php echo esc_url(home_url('/about')); ?>" 
                   class="text-foreground hover:text-primary font-semibold transition-colors duration-300 py-3">
                    About Us
                </a>
                <a href="<?php echo esc_url(home_url('/faqs')); ?>" 
                   class="text-foreground hover:text-primary font-semibold transition-colors duration-300 py-3">
                    FAQs
                </a>
                
                <!-- Mobile CTA -->
                <div class="pt-4 border-t border-border space-y-3">
                    <div class="flex gap-3">
                        <a href="tel:+442038355033"
                           class="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground py-3 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            Call
                        </a>
                        <a href="https://wa.me/442038355033" 
                           target="_blank"
                           rel="noopener noreferrer"
                           class="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground py-3 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            WhatsApp
                        </a>
                    </div>
                    <a href="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="block w-full text-center bg-primary-dark text-white hover:text-gray-300 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300">
                        Get Free Quote
                    </a>
                </div>
            </nav>
        </div>
    </div>
</header>

<script>
    function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        const icon = document.getElementById('menu-icon');
        
        if (menu.classList.contains('active')) {
            menu.classList.remove('active');
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
            icon.classList.remove('rotate-90');
        } else {
            menu.classList.add('active');
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
            icon.classList.add('rotate-90');
        }
    }
</script>
