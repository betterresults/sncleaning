<?php
/**
 * Template Name: End of Tenancy Cleaning Borough Templates
 * Template Post Type: page
 * Description: Complete template for end of tenancy cleaning service pages with dynamic custom fields
 */

// Include template functions
require_once(plugin_dir_path(__FILE__) . '../inc/template-functions.php');

// Get global post object
global $post;

get_header(); ?>

<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Dynamic Page Title: [page_title] -->
    <title><?php echo esc_html(esn_get_field('page_title', get_the_title())); ?></title>
    <!-- Dynamic Meta Description: [meta_description] -->
    <meta name="description" content="<?php echo esc_attr(esn_get_field('meta_description')); ?>">
    <?php wp_head(); ?>
    
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Custom CSS matching React template -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap');
        
        :root {
            --primary: hsl(180, 63%, 36%);
            --primary-light: hsl(180, 45%, 40%);
            --primary-dark: hsl(203, 55%, 25%);
            --primary-foreground: hsl(0, 0%, 100%);
            --background: hsl(0, 0%, 100%);
            --foreground: hsl(203, 55%, 25%);
            --muted: hsl(210, 40%, 96%);
            --muted-foreground: hsl(210, 11%, 22%);
            --card: hsl(0, 0%, 100%);
            --border: hsl(210, 40%, 90%);
            --success: hsl(180, 63%, 36%);
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--background);
            color: var(--foreground);
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 600;
        }
        
        /* Animations */
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
        }
        
        /* Custom styles */
        .gradient-border {
            background: linear-gradient(135deg, #14b8a6, #0891b2);
            padding: 2px;
            border-radius: 12px;
        }
        
        .gradient-border-inner {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
        }
        
        .checklist-item {
            transition: all 0.3s ease;
        }
        
        .checklist-item:hover {
            transform: translateX(4px);
            background-color: #f8fafc;
        }
        
        /* Responsive font sizes */
        .text-responsive-xl {
            font-size: clamp(1.125rem, 2.5vw, 1.25rem);
        }
        
        .text-responsive-2xl {
            font-size: clamp(1.5rem, 4vw, 1.875rem);
        }
        
        .text-responsive-4xl {
            font-size: clamp(2.25rem, 6vw, 3.5rem);
        }
        
        .text-responsive-6xl {
            font-size: clamp(3rem, 8vw, 4.5rem);
        }
        
        /* Custom buttons */
        .btn-primary {
            background: linear-gradient(135deg, #14b8a6, #0891b2);
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.75rem;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(20, 184, 166, 0.3);
            color: white;
            text-decoration: none;
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.75rem;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
        }
    </style>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: 'hsl(var(--primary))',
                        'primary-light': 'hsl(var(--primary-light))',
                        'primary-dark': 'hsl(var(--primary-dark))',
                        'primary-foreground': 'hsl(var(--primary-foreground))',
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        muted: 'hsl(var(--muted))',
                        'muted-foreground': 'hsl(var(--muted-foreground))',
                        card: 'hsl(var(--card))',
                        border: 'hsl(var(--border))',
                        success: 'hsl(var(--success))'
                    },
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                        display: ['Poppins', 'system-ui', 'sans-serif']
                    }
                }
            }
        }
    </script>
</head>

<body class="antialiased">
    <!-- Hero Section with Dynamic Content -->
    <section class="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <!-- Dynamic Background Image: [hero_image] -->
        <div class="absolute inset-0 z-0">
            <img src="<?php echo esc_url(esn_get_field('hero_image', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')); ?>" 
                 alt="<?php echo esc_attr(esn_get_field('hero_image_alt', 'Professional cleaning service')); ?>" 
                 class="w-full h-full object-cover opacity-30">
            <div class="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80"></div>
        </div>
        
        <div class="relative z-10 container mx-auto px-4 pt-32 pb-16 lg:pt-40">
            <div class="grid lg:grid-cols-2 gap-12 items-center">
                <!-- Hero Content -->
                <div class="space-y-8">
                    <div class="space-y-6">
                        <!-- Dynamic H1: [page_h1] -->
                        <h1 class="text-4xl lg:text-6xl font-bold text-white leading-tight">
                            <?php echo wp_kses_post(esn_get_field('page_h1', 'End of Tenancy Cleaning in <span class="bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">London</span>')); ?>
                        </h1>
                        <!-- Dynamic Under Heading: [under_heading] -->
                        <p class="text-xl lg:text-2xl text-slate-300 leading-relaxed">
                            <?php echo esc_html(esn_get_field('under_heading', 'Professional end of tenancy cleaning services to guarantee your full deposit return. Trusted by thousands of tenants across London.')); ?>
                        </p>
                    </div>
                    
                    <!-- Key Points -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                            <div class="w-2 h-2 bg-teal-400 rounded-full flex-shrink-0"></div>
                            <span class="text-white font-medium">Deposit Back Guarantee</span>
                        </div>
                        <div class="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                            <div class="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                            <span class="text-white font-medium">Professional Cleaners</span>
                        </div>
                        <div class="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                            <div class="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></div>
                            <span class="text-white font-medium">Same Day Service</span>
                        </div>
                    </div>
                    
                    <!-- CTA Buttons -->
                    <div class="flex flex-col sm:flex-row gap-4">
                        <a href="#quote" class="btn-primary text-center">
                            Get Instant Quote
                        </a>
                        <a href="tel:+44" class="btn-secondary text-center">
                            Call Now: 020 XXXX XXXX
                        </a>
                    </div>
                </div>
                
                <!-- Quote Form -->
                <div class="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-slate-900 mb-2">Get Your Free Quote</h3>
                        <p class="text-slate-600">Instant pricing in under 60 seconds</p>
                    </div>
                    
                    <form class="space-y-4" id="quote-form">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Your Name" class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                            <input type="tel" placeholder="Phone Number" class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        </div>
                        <input type="email" placeholder="Email Address" class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        <textarea placeholder="Property details (size, special requirements)" rows="3" class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"></textarea>
                        <button type="submit" class="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-200">
                            Get My Free Quote
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>
    
    <!-- H2 Section with Dynamic Content -->
    <section class="py-20 bg-white">
        <div class="container mx-auto px-4">
            <div class="grid lg:grid-cols-2 gap-16 items-center">
                <div class="space-y-8">
                    <div class="space-y-6">
                        <!-- Dynamic About Section Heading: [page_subheading] -->
                        <h2 class="text-4xl lg:text-5xl font-bold leading-tight">
                            <?php echo esc_html(esn_get_field('page_subheading', 'Why Choose Our Professional Cleaning Service?')); ?>
                        </h2>
                        <!-- Dynamic About Section Description: [page_subheading_description] -->
                        <p class="text-xl text-slate-600 leading-relaxed">
                            <?php echo esc_html(esn_get_field('page_subheading_description', 'With years of experience and thousands of satisfied customers, we deliver exceptional cleaning results that guarantee your deposit return. Our comprehensive service covers every corner of your property.')); ?>
                        </p>
                    </div>
                    
                    <!-- Statistics -->
                    <div class="grid grid-cols-3 gap-6">
                        <div class="text-center">
                            <div class="text-3xl font-bold text-teal-600 mb-2">5,000+</div>
                            <div class="text-slate-600 font-medium">Happy Customers</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-teal-600 mb-2">98%</div>
                            <div class="text-slate-600 font-medium">Success Rate</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-teal-600 mb-2">200+</div>
                            <div class="text-slate-600 font-medium">Expert Cleaners</div>
                        </div>
                    </div>
                </div>
                
                <div class="relative">
                    <!-- Dynamic Content Section Image: [page_image] -->
                    <img src="<?php echo esc_url(esn_get_field('page_image', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')); ?>" 
                         alt="<?php echo esc_attr(esn_get_field('page_image_alt', 'Professional cleaner at work')); ?>" 
                         class="rounded-2xl shadow-2xl w-full h-auto">
                    <div class="absolute -bottom-8 -right-8 bg-white p-6 rounded-xl shadow-xl border border-slate-100">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-teal-600">98%</div>
                            <div class="text-sm text-slate-600">Success Rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Process Section -->
    <section class="py-20 bg-slate-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold mb-6">Simple 3-Step Process</h2>
                <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                    Getting your deposit back has never been easier with our streamlined booking process
                </p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8">
                <div class="text-center group">
                    <div class="mb-6">
                        <div class="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                            <span class="text-3xl font-bold text-white">1</span>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">Book Online</h3>
                        <p class="text-slate-600 leading-relaxed">
                            Fill out our simple form or call us directly. Get an instant quote based on your property size and requirements.
                        </p>
                    </div>
                </div>
                
                <div class="text-center group">
                    <div class="mb-6">
                        <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                            <span class="text-3xl font-bold text-white">2</span>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">Professional Cleaning</h3>
                        <p class="text-slate-600 leading-relaxed">
                            Our vetted and insured team arrives on time with professional equipment and eco-friendly products.
                        </p>
                    </div>
                </div>
                
                <div class="text-center group">
                    <div class="mb-6">
                        <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                            <span class="text-3xl font-bold text-white">3</span>
                        </div>
                        <h3 class="text-2xl font-bold mb-4">Get Your Deposit</h3>
                        <p class="text-slate-600 leading-relaxed">
                            Relax while we handle everything. Our guarantee ensures you get your full deposit back or we return for free.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Why Us Section -->
    <section class="py-20 bg-white">
        <div class="container mx-auto px-4">
            <div class="grid lg:grid-cols-2 gap-16 items-center">
                <div class="space-y-8">
                    <div class="space-y-6">
                        <h2 class="text-4xl lg:text-5xl font-bold leading-tight">
                            Why Tenants Trust Us
                        </h2>
                        <p class="text-xl text-slate-600 leading-relaxed">
                            We understand the stress of moving out. That's why we've built our service around one simple promise: your deposit back, guaranteed.
                        </p>
                    </div>
                    
                    <div class="space-y-6">
                        <div class="flex items-start space-x-4">
                            <div class="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg class="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-slate-900 mb-2">100% Deposit Back Guarantee</h3>
                                <p class="text-slate-600">If your landlord isn't satisfied, we'll return for free until they are.</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-4">
                            <div class="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg class="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-slate-900 mb-2">Fully Insured & Vetted Team</h3>
                                <p class="text-slate-600">All our cleaners are background checked, trained, and fully insured for your peace of mind.</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-4">
                            <div class="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg class="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-slate-900 mb-2">Professional Equipment</h3>
                                <p class="text-slate-600">We bring all professional-grade equipment and eco-friendly cleaning products.</p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-4">
                            <div class="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg class="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-slate-900 mb-2">Same Day Service Available</h3>
                                <p class="text-slate-600">Last-minute booking? We can often accommodate same-day cleaning requests.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="relative">
                    <img src="https://images.unsplash.com/photo-1587691592099-24045742c181?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                         alt="Professional cleaning team" 
                         class="rounded-2xl shadow-2xl w-full h-auto">
                </div>
            </div>
        </div>
    </section>
    
    <!-- Testimonials Section -->
    <section class="py-20 bg-slate-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold mb-6">What Our Customers Say</h2>
                <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                    Join thousands of satisfied tenants who got their deposits back with our help
                </p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-white rounded-xl p-8 shadow-lg border border-slate-100">
                    <div class="flex mb-4">
                        <?php for ($i = 0; $i < 5; $i++): ?>
                            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                        <?php endfor; ?>
                    </div>
                    <p class="text-slate-600 mb-6 leading-relaxed">
                        "Amazing service! Got my full £2,000 deposit back. The team was thorough, professional, and arrived exactly on time. Couldn't be happier!"
                    </p>
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span class="text-white font-semibold">SM</span>
                        </div>
                        <div class="ml-4">
                            <div class="font-semibold text-slate-900">Sarah Miller</div>
                            <div class="text-slate-500 text-sm">Tenant in Clapham</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-8 shadow-lg border border-slate-100">
                    <div class="flex mb-4">
                        <?php for ($i = 0; $i < 5; $i++): ?>
                            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                        <?php endfor; ?>
                    </div>
                    <p class="text-slate-600 mb-6 leading-relaxed">
                        "Booked last minute and they accommodated same day service. The flat was spotless and my landlord was impressed. Highly recommended!"
                    </p>
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span class="text-white font-semibold">JD</span>
                        </div>
                        <div class="ml-4">
                            <div class="font-semibold text-slate-900">James Davidson</div>
                            <div class="text-slate-500 text-sm">Tenant in Shoreditch</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-8 shadow-lg border border-slate-100">
                    <div class="flex mb-4">
                        <?php for ($i = 0; $i < 5; $i++): ?>
                            <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                        <?php endfor; ?>
                    </div>
                    <p class="text-slate-600 mb-6 leading-relaxed">
                        "Professional, reliable, and worth every penny. They cleaned areas I didn't even think of. My deposit was returned in full within days!"
                    </p>
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                            <span class="text-white font-semibold">LW</span>
                        </div>
                        <div class="ml-4">
                            <div class="font-semibold text-slate-900">Lisa Wong</div>
                            <div class="text-slate-500 text-sm">Tenant in Camden</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Checklist Section -->
    <section class="py-20 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold mb-6">Comprehensive Cleaning Checklist</h2>
                <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                    Every item on this checklist is completed to professional standards, ensuring nothing is overlooked
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Kitchen -->
                <div class="bg-slate-50 rounded-2xl p-8">
                    <div class="mb-6">
                        <div class="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-slate-900 mb-4">Kitchen</h3>
                    </div>
                    
                    <div class="space-y-3">
                        <?php
                        $kitchen_items = [
                            'Deep clean oven inside and out',
                            'Degrease extractor fan and filters',
                            'Clean all appliances (microwave, dishwasher, etc.)',
                            'Descale kettle and clean toaster',
                            'Clean inside and outside of all cabinets',
                            'Sanitize countertops and backsplash',
                            'Clean sink and polish taps',
                            'Mop floors and clean behind appliances'
                        ];
                        foreach ($kitchen_items as $item): ?>
                            <div class="checklist-item flex items-center space-x-3 p-2 rounded-lg">
                                <div class="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                                <span class="text-slate-700"><?php echo esc_html($item); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- Bathroom -->
                <div class="bg-slate-50 rounded-2xl p-8">
                    <div class="mb-6">
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-slate-900 mb-4">Bathroom</h3>
                    </div>
                    
                    <div class="space-y-3">
                        <?php
                        $bathroom_items = [
                            'Descale and disinfect toilet inside and out',
                            'Remove limescale from shower and bath',
                            'Clean and polish all mirrors',
                            'Scrub tiles and grout thoroughly',
                            'Clean and disinfect all surfaces',
                            'Polish taps and fittings',
                            'Clean bathroom cabinets inside and out',
                            'Mop floors and clean behind toilet'
                        ];
                        foreach ($bathroom_items as $item): ?>
                            <div class="checklist-item flex items-center space-x-3 p-2 rounded-lg">
                                <div class="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                                <span class="text-slate-700"><?php echo esc_html($item); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- Bedrooms -->
                <div class="bg-slate-50 rounded-2xl p-8">
                    <div class="mb-6">
                        <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-slate-900 mb-4">Bedrooms</h3>
                    </div>
                    
                    <div class="space-y-3">
                        <?php
                        $bedroom_items = [
                            'Vacuum carpets or mop hard floors',
                            'Clean inside and outside of wardrobes',
                            'Dust all surfaces and furniture',
                            'Clean mirrors and glass surfaces',
                            'Wipe down skirting boards',
                            'Clean light switches and sockets',
                            'Remove marks from walls',
                            'Clean windows and window sills'
                        ];
                        foreach ($bedroom_items as $item): ?>
                            <div class="checklist-item flex items-center space-x-3 p-2 rounded-lg">
                                <div class="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                                <span class="text-slate-700"><?php echo esc_html($item); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- Living Areas -->
                <div class="bg-slate-50 rounded-2xl p-8">
                    <div class="mb-6">
                        <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-slate-900 mb-4">Living Areas</h3>
                    </div>
                    
                    <div class="space-y-3">
                        <?php
                        $living_items = [
                            'Vacuum carpets and rugs thoroughly',
                            'Clean and dust all furniture',
                            'Polish coffee tables and surfaces',
                            'Clean TV and entertainment units',
                            'Wipe down all surfaces',
                            'Clean light fixtures and lampshades',
                            'Dust decorative items',
                            'Clean windows and blinds'
                        ];
                        foreach ($living_items as $item): ?>
                            <div class="checklist-item flex items-center space-x-3 p-2 rounded-lg">
                                <div class="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                                <span class="text-slate-700"><?php echo esc_html($item); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- Hallways -->
                <div class="bg-slate-50 rounded-2xl p-8">
                    <div class="mb-6">
                        <div class="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-slate-900 mb-4">Hallways</h3>
                    </div>
                    
                    <div class="space-y-3">
                        <?php
                        $hallway_items = [
                            'Vacuum or mop all floor surfaces',
                            'Clean and dust storage cupboards',
                            'Wipe down all wall surfaces',
                            'Clean light switches and sockets',
                            'Polish banisters and handrails',
                            'Clean entrance doors inside and out',
                            'Dust picture frames and decorations',
                            'Clean entrance mats and doormats'
                        ];
                        foreach ($hallway_items as $item): ?>
                            <div class="checklist-item flex items-center space-x-3 p-2 rounded-lg">
                                <div class="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                                <span class="text-slate-700"><?php echo esc_html($item); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- General Areas -->
                <div class="bg-slate-50 rounded-2xl p-8">
                    <div class="mb-6">
                        <div class="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-slate-900 mb-4">General Areas</h3>
                    </div>
                    
                    <div class="space-y-3">
                        <?php
                        $general_items = [
                            'Clean all windows inside and out',
                            'Wipe down all skirting boards',
                            'Remove cobwebs from corners',
                            'Clean all door frames and doors',
                            'Polish all handles and fixtures',
                            'Empty and clean all bins',
                            'Final inspection and touch-ups',
                            'Take before/after photos for records'
                        ];
                        foreach ($general_items as $item): ?>
                            <div class="checklist-item flex items-center space-x-3 p-2 rounded-lg">
                                <div class="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg class="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                                <span class="text-slate-700"><?php echo esc_html($item); ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Content Section (H4) with Dynamic Content -->
    <section class="py-20 bg-slate-50">
        <div class="container mx-auto px-4">
            <div class="grid lg:grid-cols-2 gap-16 items-start">
                <div class="space-y-8">
                    <div class="space-y-6">
                        <!-- Dynamic H4: [page_h4] -->
                        <h4 class="text-3xl lg:text-4xl font-bold leading-tight">
                            <?php echo esc_html(esn_get_field('page_h4', 'Premium Standards You Can Trust')); ?>
                        </h4>
                        <!-- Dynamic H4 Paragraph 1: [page_h4_paragraph_1] -->
                        <p class="text-lg text-slate-600 leading-relaxed">
                            <?php echo esc_html(esn_get_field('page_h4_paragraph_1', 'Our commitment to excellence means every cleaning task is performed to the highest standards. We use professional-grade equipment and eco-friendly products to ensure your property is spotless and safe.')); ?>
                        </p>
                        <!-- Dynamic H4 Paragraph 2: [page_h4_paragraph_2] -->
                        <p class="text-lg text-slate-600 leading-relaxed">
                            <?php echo esc_html(esn_get_field('page_h4_paragraph_2', 'From deep carpet cleaning to sanitizing all surfaces, we leave no stone unturned. Our detailed checklist ensures comprehensive coverage of your entire property, giving you peace of mind for your deposit return.')); ?>
                        </p>
                    </div>
                </div>
                
                <div class="space-y-8">
                    <div class="space-y-6">
                        <!-- Dynamic H2: [page_h2] -->
                        <h4 class="text-3xl lg:text-4xl font-bold leading-tight">
                            <?php echo esc_html(esn_get_field('page_h2', 'Trusted Professionals')); ?>
                        </h4>
                        <!-- Dynamic H2 Paragraph: [page_h2_paragraph] -->
                        <p class="text-lg text-slate-600 leading-relaxed">
                            <?php echo esc_html(esn_get_field('page_h2_paragraph', 'All our cleaners are fully vetted, insured, and trained to deliver exceptional results. We understand the importance of your deposit return and work tirelessly to exceed your expectations.')); ?>
                        </p>
                        <!-- Dynamic H3: [page_h3] and H3 Paragraph: [page_h3_paragraph] -->
                        <p class="text-lg text-slate-600 leading-relaxed">
                            <?php echo esc_html(esn_get_field('page_h3_paragraph', 'With transparent pricing and no hidden fees, you can trust us to provide honest, reliable service. Join thousands of satisfied customers who have successfully reclaimed their full deposits with our help.')); ?>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Service Areas Section with Dynamic Content -->
    <section class="py-20 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold mb-6">Service Areas</h2>
                <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                    <!-- Dynamic Area: [page_area] and Borough: [page_borough] -->
                    We provide professional end of tenancy cleaning services across <?php echo esc_html(esn_get_field('page_area', 'London')); ?> and <?php echo esc_html(esn_get_field('page_borough', 'surrounding areas')); ?>
                </p>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <?php 
                $service_areas = esn_get_service_areas();
                foreach ($service_areas as $area): ?>
                    <div class="p-4 bg-slate-50 rounded-lg text-center hover:bg-teal-50 transition-colors duration-200">
                        <span class="text-slate-700 font-medium"><?php echo esc_html($area); ?></span>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    
    <!-- Cast Iron Guarantee Section -->
    <section class="py-20 bg-gradient-to-br from-teal-900 via-teal-800 to-blue-900 text-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold mb-6">Our Cast Iron Guarantee</h2>
                <p class="text-xl text-teal-100 max-w-3xl mx-auto">
                    We're so confident in our service quality that we offer an unmatched guarantee
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 gap-12 items-center">
                <div class="space-y-8">
                    <div class="space-y-6">
                        <div class="flex items-start space-x-4">
                            <div class="w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg class="w-5 h-5 text-teal-900" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold mb-3">100% Deposit Return Guarantee</h3>
                                <p class="text-teal-100 leading-relaxed">
                                    If your landlord isn't completely satisfied with our cleaning, we'll return to re-clean any areas free of charge until you get your full deposit back.
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-4">
                            <div class="w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg class="w-5 h-5 text-teal-900" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold mb-3">Free Re-cleaning</h3>
                                <p class="text-teal-100 leading-relaxed">
                                    Not happy with any aspect of our cleaning? We'll return within 48 hours to address any concerns at no extra cost.
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex items-start space-x-4">
                            <div class="w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg class="w-5 h-5 text-teal-900" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold mb-3">Fully Insured Service</h3>
                                <p class="text-teal-100 leading-relaxed">
                                    All our work is covered by comprehensive insurance, giving you complete peace of mind throughout the process.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="text-center">
                    <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                        <div class="text-6xl font-bold text-teal-400 mb-4">98%</div>
                        <div class="text-2xl font-semibold mb-2">Success Rate</div>
                        <div class="text-teal-100 mb-6">Of customers get their full deposit back</div>
                        
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-teal-100">Average deposit saved:</span>
                                <span class="text-2xl font-bold text-white">£1,847</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-teal-100">Customer satisfaction:</span>
                                <span class="text-2xl font-bold text-white">4.9/5</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- FAQ Section with Dynamic Content -->
    <section class="py-20 bg-slate-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
                <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                    Get answers to common questions about our end of tenancy cleaning service
                </p>
            </div>
            
            <div class="max-w-4xl mx-auto space-y-4">
                <?php 
                // Dynamic FAQ Questions and Answers: [page_question_1], [page_answer_1], [page_question_2], [page_answer_2]
                $dynamic_faqs = array();
                
                // Add dynamic FAQ 1 if it exists
                $question1 = esn_get_field('page_question_1');
                $answer1 = esn_get_field('page_answer_1');
                if (!empty($question1) && !empty($answer1)) {
                    $dynamic_faqs[] = array('question' => $question1, 'answer' => $answer1);
                }
                
                // Add dynamic FAQ 2 if it exists
                $question2 = esn_get_field('page_question_2');
                $answer2 = esn_get_field('page_answer_2');
                if (!empty($question2) && !empty($answer2)) {
                    $dynamic_faqs[] = array('question' => $question2, 'answer' => $answer2);
                }
                
                // If no dynamic FAQs, fall back to static ones
                $faqs = !empty($dynamic_faqs) ? $dynamic_faqs : esn_get_static_faqs();
                
                foreach ($faqs as $index => $faq): ?>
                    <div class="bg-white rounded-lg shadow-sm border border-slate-200">
                        <button class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-slate-50 transition-colors duration-200" onclick="toggleFAQ(<?php echo $index; ?>)">
                            <span class="font-semibold text-slate-900"><?php echo esc_html($faq['question']); ?></span>
                            <svg class="w-5 h-5 text-slate-500 transform transition-transform duration-200" id="faq-icon-<?php echo $index; ?>" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div class="px-6 pb-4 text-slate-600 hidden" id="faq-content-<?php echo $index; ?>">
                            <p><?php echo wp_kses_post($faq['answer']); ?></p>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <script>
        function toggleFAQ(index) {
            const content = document.getElementById('faq-content-' + index);
            const icon = document.getElementById('faq-icon-' + index);
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.classList.add('hidden');
                icon.style.transform = 'rotate(0deg)';
            }
        }
    </script>

<?php wp_footer(); ?>
</body>
</html>