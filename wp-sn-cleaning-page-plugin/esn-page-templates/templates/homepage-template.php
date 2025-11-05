<?php
/**
 * Template Name: ESN Homepage Template
 * Description: Complete homepage template with all sections
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get page meta values
$page_id = get_the_ID();

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <!-- SEO -->
    <title><?php bloginfo('name'); ?> — Best Cleaners in Your Area</title>
    <meta name="description" content="Professional cleaning services in London & Essex. Get instant quotes, book online, and enjoy guaranteed, 5-star rated cleaning." />
    <link rel="canonical" href="<?php echo esc_url(get_permalink()); ?>" />
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<?php include ESN_TEMPLATES_PLUGIN_PATH . 'templates/header-esn.php'; ?>

<div id="page" class="site min-h-screen bg-background">
    
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center overflow-hidden">
        <!-- Background Image with Overlay -->
        <div class="absolute inset-0 z-0" style="background-image: linear-gradient(135deg, rgba(28, 60, 80, 0.9), rgba(24, 81, 102, 0.85)), url(<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/hero-kitchen.jpg); background-size: cover; background-position: center center; background-attachment: fixed;"></div>
        
        <!-- Animated Background Elements -->
        <div class="absolute inset-0 z-10">
            <div class="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
            <div class="absolute bottom-32 right-20 w-24 h-24 bg-accent/20 rounded-full blur-lg animate-float" style="animation-delay: 2s;"></div>
            <div class="absolute top-1/2 left-1/4 w-16 h-16 bg-primary-light/20 rounded-full blur-md animate-float" style="animation-delay: 4s;"></div>
        </div>

        <div class="section-container relative z-20 section-padding">
            <div class="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
                <!-- Hero Content -->
                <div class="lg:col-span-3 text-white space-y-8 animate-slide-up">
                    <div class="space-y-6">
                        <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold font-heading leading-tight text-center lg:text-left">
                            <span class="block">Best Cleaners</span>
                            <span class="block">In Your <span class="text-primary">Area</span></span>
                        </h1>
                        
                        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-semibold text-accent leading-relaxed text-center lg:text-left">
                            Professional Cleaning Services
                        </h2>
                        
                        <p class="text-lg sm:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
                            Experience reliable & professional cleaning services. 
                            <span class="font-semibold text-accent"> Book online today</span> and enjoy a spotless home or office.
                        </p>
                    </div>

                    <!-- Trust Badges -->
                    <div class="grid grid-cols-2 lg:flex lg:flex-wrap gap-3 lg:gap-4 pt-4 max-w-md lg:max-w-none">
                        <div class="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                            <span class="font-semibold text-xs lg:text-sm">🛡️ Fully Insured</span>
                        </div>
                        <div class="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                            <span class="font-semibold text-xs lg:text-sm">⭐ 5-Star Rated</span>
                        </div>
                        <div class="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                            <span class="font-semibold text-xs lg:text-sm">✅ Same-Day Service</span>
                        </div>
                        <div class="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                            <span class="font-semibold text-xs lg:text-sm">📍 Local Experts</span>
                        </div>
                    </div>
                </div>

                <!-- Quote Form -->
                <div class="lg:col-span-2 animate-fade-in-delayed">
                    <!-- Desktop Form -->
                    <div class="hidden lg:block card-glass p-6 lg:p-8 max-w-md mx-auto lg:ml-auto lg:mr-0">
                        <div class="text-center mb-6">
                            <h3 class="text-3xl font-bold font-heading text-foreground mb-3">
                                Get Your Instant Quote
                            </h3>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center bg-background rounded-xl border-2 border-input shadow-sm px-4 py-3">
                                <span class="mr-3">📍</span>
                                <input type="text" placeholder="Enter a postcode here" class="border-0 bg-transparent text-lg placeholder:text-gray-400 p-0 font-medium w-full" />
                            </div>
                            
                            <a href="#quote" class="btn-primary w-full h-14 text-lg flex items-center justify-center">
                                Get A Quote
                                <span class="ml-2">→</span>
                            </a>
                        </div>
                    </div>

                    <!-- Mobile Form -->
                    <div class="lg:hidden w-full max-w-2xl mx-auto">
                        <div class="bg-background rounded-2xl p-3 shadow-xl border border-input">
                            <div class="flex items-center px-4 py-3">
                                <span class="mr-3">📍</span>
                                <input type="text" placeholder="Enter a postcode here" class="border-0 bg-transparent text-lg placeholder:text-gray-400 p-0 font-medium w-full" />
                            </div>
                            <a href="#quote" class="btn-primary w-full h-12 text-base mt-2 flex items-center justify-center">
                                Get A Quote
                                <span class="ml-2">→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Service Types Section -->
    <section class="section-padding bg-gradient-to-b from-muted/30 to-background">
        <div class="section-container">
            <!-- Residential Services -->
            <div class="mb-20">
                <div class="text-center mb-16">
                    <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">Residential Cleaning Services</h2>
                    <p class="text-xl text-muted-foreground max-w-3xl mx-auto">Professional home cleaning solutions with real people who care about your space</p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Card 1 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../wp-content/uploads/2024/02/professional-moving-in-cleaning.jpg" alt="End of Tenancy cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">End of Tenancy</h3>
                            <p class="text-muted-foreground leading-relaxed">Complete move-out cleaning to get your deposit back with professional standards and equipment.</p>
                            <a href="#" class="inline-flex items-center justify-center w-full mt-6 border border-border rounded-xl px-4 py-3 group-hover:bg-primary group-hover:text-white transition-colors">Learn More <span class="ml-2">→</span></a>
                        </div>
                    </div>

                    <!-- Card 2 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/after-builders-cleaning.jpg" alt="After Builders cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">After Builders</h3>
                            <p class="text-muted-foreground leading-relaxed">Post-construction cleanup and dust removal including paint splatter cleaning and surface restoration.</p>
                            <a href="#" class="inline-flex items-center justify-center w-full mt-6 border border-border rounded-xl px-4 py-3 group-hover:bg-primary group-hover:text-white transition-colors">Learn More <span class="ml-2">→</span></a>
                        </div>
                    </div>

                    <!-- Card 3 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/domestic-cleaning.jpg" alt="Domestic Cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">Domestic Cleaning</h3>
                            <p class="text-muted-foreground leading-relaxed">Regular weekly, fortnightly or monthly home cleaning with flexible scheduling and consistent quality.</p>
                            <a href="#" class="inline-flex items-center justify-center w-full mt-6 border border-border rounded-xl px-4 py-3 group-hover:bg-primary group-hover:text-white transition-colors">Learn More <span class="ml-2">→</span></a>
                        </div>
                    </div>

                    <!-- Card 4 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/airbnb-cleaning.jpg" alt="Airbnb Cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">Airbnb Cleaning</h3>
                            <p class="text-muted-foreground leading-relaxed">Turnaround cleaning for short-term rentals with quick service and guest-ready standards.</p>
                            <a href="#" class="inline-flex items-center justify-center w-full mt-6 border border-border rounded-xl px-4 py-3 group-hover:bg-primary group-hover:text-white transition-colors">Learn More <span class="ml-2">→</span></a>
                        </div>
                    </div>

                    <!-- Card 5 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/domestic-cleaning.jpg" alt="Deep House Cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">Deep House Cleaning</h3>
                            <p class="text-muted-foreground leading-relaxed">Comprehensive one-time deep cleaning service covering every corner and inside appliances.</p>
                            <a href="#" class="inline-flex items-center justify-center w-full mt-6 border border-border rounded-xl px-4 py-3 group-hover:bg-primary group-hover:text-white transition-colors">Learn More <span class="ml-2">→</span></a>
                        </div>
                    </div>

                    <!-- Card 6 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/carpet-cleaning.jpg" alt="Carpet Cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">Carpet Cleaning</h3>
                            <p class="text-muted-foreground leading-relaxed">Professional carpet and upholstery cleaning with steam cleaning and fast drying technology.</p>
                            <a href="#" class="inline-flex items-center justify-center w-full mt-6 border border-border rounded-xl px-4 py-3 group-hover:bg-primary group-hover:text-white transition-colors">Learn More <span class="ml-2">→</span></a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Commercial Services -->
            <div>
                <div class="text-center mb-16">
                    <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">Commercial Cleaning Services</h2>
                    <p class="text-xl text-muted-foreground max-w-3xl mx-auto">Professional business cleaning with experienced teams you can trust</p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <!-- Card 1 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/office-cleaning.jpg" alt="Office Cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Office Cleaning</h3>
                            <p class="text-muted-foreground text-sm leading-relaxed">Professional office maintenance and sanitization with daily or weekly service options.</p>
                            <a href="#" class="btn-primary w-full mt-4">Get Quote <span class="ml-2">→</span></a>
                        </div>
                    </div>

                    <!-- Card 2 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/office-cleaning.jpg" alt="School Cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-xl font-bold text-foreground group-hover:text-primary transition-colors">School Cleaning</h3>
                            <p class="text-muted-foreground text-sm leading-relaxed">Educational facility cleaning with child-safe products and classroom sanitization.</p>
                            <a href="#" class="btn-primary w-full mt-4">Get Quote <span class="ml-2">→</span></a>
                        </div>
                    </div>

                    <!-- Card 3 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/office-cleaning.jpg" alt="Nursery Cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Nursery Cleaning</h3>
                            <p class="text-muted-foreground text-sm leading-relaxed">Specialized cleaning for childcare facilities using only non-toxic products.</p>
                            <a href="#" class="btn-primary w-full mt-4">Get Quote <span class="ml-2">→</span></a>
                        </div>
                    </div>

                    <!-- Card 4 -->
                    <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div class="relative h-48 overflow-hidden">
                            <img src="<?php echo ESN_TEMPLATES_PLUGIN_URL; ?>../src/assets/office-cleaning.jpg" alt="Retail Cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Retail Cleaning</h3>
                            <p class="text-muted-foreground text-sm leading-relaxed">Specialized cleaning for retail environments with customer-friendly hours.</p>
                            <a href="#" class="btn-primary w-full mt-4">Get Quote <span class="ml-2">→</span></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="section-padding bg-gradient-to-br from-foreground via-primary-dark to-foreground">
        <div class="section-container">
            <div class="text-center mb-16">
                <div class="inline-block bg-primary/20 text-primary px-6 py-3 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-primary/30">WHY WE'RE DIFFERENT</div>
                <h2 class="text-4xl lg:text-5xl font-bold font-heading text-white leading-tight mb-6">Features That Make Us <span class="text-primary block">The Professional Choice</span></h2>
                <p class="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">We've built our service around what matters most to you - convenience, quality, and peace of mind. Here's what sets us apart from the competition.</p>
            </div>

            <!-- 3x3 Features Grid -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                <!-- Repeatable feature cards -->
                <?php 
                $features = [
                    ['icon' => '⚡','title' => 'Same Day Emergency Cleaning','short' => 'Available 7 days a week','full' => 'Need urgent cleaning? We offer same-day emergency services to handle any cleaning crisis. Professional equipment and experienced team ready when you need us most.'],
                    ['icon' => '🕒','title' => 'Flexible Scheduling','short' => 'Your time, your choice','full' => 'Book cleaning services that fit your schedule. Early morning, evening, weekend, and holiday slots available. Change or reschedule appointments easily.'],
                    ['icon' => '🎧','title' => '24/7 Customer Support','short' => 'Always here for you','full' => 'Questions or concerns? Our customer support team is available around the clock to help you. Call, text, or message us anytime.'],
                    ['icon' => '🛡️','title' => 'Satisfaction Guarantee','short' => '100% satisfaction promise','full' => 'Not happy with the service? We\'ll come back and make it right at no additional cost.'],
                    ['icon' => '👥','title' => 'Dedicated Team Assignment','short' => 'Consistent quality','full' => 'Get the same professional cleaning team every visit for consistent, personalized service.'],
                    ['icon' => '📱','title' => 'Online Customer Portal','short' => '24/7 online access','full' => 'Manage your bookings, track cleaning progress, and communicate with your team through our portal.'],
                    ['icon' => '📅','title' => 'Easy Rebooking','short' => 'One-click rebooking','full' => 'Rebook your favorite cleaner with just one click through your customer portal.'],
                    ['icon' => '⭐','title' => 'Quality Assurance','short' => 'Consistently excellent','full' => 'Every cleaning is quality-checked and rated to ensure high standards.'],
                    ['icon' => '✔️','title' => 'Licensed & Insured','short' => 'Fully protected service','full' => 'All our cleaners are fully licensed and insured for your peace of mind.'],
                ];
                foreach ($features as $f): ?>
                <div class="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                    <div class="space-y-4">
                        <div class="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors text-2xl"><?= $f['icon']; ?></div>
                        <div class="space-y-2">
                            <h4 class="text-xl font-bold font-heading text-white group-hover:text-primary transition-colors"><?= $f['title']; ?></h4>
                            <p class="text-primary font-medium text-sm"><?= $f['short']; ?></p>
                            <div class="overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-32">
                                <p class="text-slate-300 text-sm leading-relaxed pt-2"><?= $f['full']; ?></p>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>

            <!-- Stats Section -->
            <div class="bg-white/5 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/10 shadow-xl">
                <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    <div class="space-y-2"><div class="text-4xl font-bold text-primary">98%</div><div class="text-slate-300 font-medium">Customer Retention Rate</div></div>
                    <div class="space-y-2"><div class="text-4xl font-bold text-primary">15min</div><div class="text-slate-300 font-medium">Average Response Time</div></div>
                    <div class="space-y-2"><div class="text-4xl font-bold text-primary">50K+</div><div class="text-slate-300 font-medium">Successful Cleanings</div></div>
                    <div class="space-y-2"><div class="text-4xl font-bold text-primary">24/7</div><div class="text-slate-300 font-medium">Support Available</div></div>
                </div>
            </div>
        </div>
    </section>

    <!-- Booking Section -->
    <section class="section-padding bg-gradient-to-b from-background to-muted/30">
        <div class="section-container">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">Simple Booking Process</h2>
                <p class="text-xl text-muted-foreground max-w-2xl mx-auto">Getting your space cleaned is easier than ever</p>
            </div>

            <!-- Process Flow Container -->
            <div class="bg-background rounded-3xl border border-border/50 shadow-xl p-8 lg:p-12 mb-16">
                <div class="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                    <!-- Step 1 -->
                    <div class="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        <div class="text-center">
                            <div class="relative mb-6">
                                <div class="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-lg"><span class="text-3xl text-white">🔍</span></div>
                                <div class="absolute -top-2 -right-2 w-8 h-8 bg-white border-4 border-primary rounded-full flex items-center justify-center text-sm font-bold text-primary shadow-lg">1</div>
                            </div>
                            <h3 class="text-2xl font-bold text-foreground mb-3">Choose Service</h3>
                            <p class="text-muted-foreground max-w-xs">Select your cleaning requirements</p>
                        </div>
                        <div class="hidden md:block"><svg class="w-8 h-8 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>
                        <div class="md:hidden rotate-90"><svg class="w-6 h-6 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>
                    </div>

                    <!-- Step 2 -->
                    <div class="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        <div class="text-center">
                            <div class="relative mb-6">
                                <div class="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-lg"><span class="text-3xl text-white">📝</span></div>
                                <div class="absolute -top-2 -right-2 w-8 h-8 bg-white border-4 border-primary rounded-full flex items-center justify-center text-sm font-bold text-primary shadow-lg">2</div>
                            </div>
                            <h3 class="text-2xl font-bold text-foreground mb-3">Fill the Form</h3>
                            <p class="text-muted-foreground max-w-xs">Provide your details and preferences</p>
                        </div>
                        <div class="hidden md:block"><svg class="w-8 h-8 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>
                        <div class="md:hidden rotate-90"><svg class="w-6 h-6 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>
                    </div>

                    <!-- Step 3 -->
                    <div class="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        <div class="text-center">
                            <div class="relative mb-6">
                                <div class="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-lg"><span class="text-3xl text-white">📅</span></div>
                                <div class="absolute -top-2 -right-2 w-8 h-8 bg-white border-4 border-primary rounded-full flex items-center justify-center text-sm font-bold text-primary shadow-lg">3</div>
                            </div>
                            <h3 class="text-2xl font-bold text-foreground mb-3">Book Online</h3>
                            <p class="text-muted-foreground max-w-xs">Select your preferred date and time</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CTA Button -->
            <div class="text-center">
                <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <a href="#quote" class="btn-hero text-xl sm:text-2xl px-8 sm:px-12 py-4 sm:py-6 rounded-2xl w-full sm:w-auto">Get Quote & Book Online<span class="ml-2">→</span></a>
                </div>
                <p class="text-sm text-muted-foreground mt-4">Free instant quotes • No hidden fees • Quick response</p>
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section class="section-padding bg-gradient-to-br from-muted/20 to-background">
        <div class="section-container">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">What Our <span class="text-primary">Customers Say</span></h2>
            </div>
            <div class="card-glass p-8 mb-12">
                <div class="fbl_w_dcWK51Qwf6A51i8gEolc"></div>
            </div>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function(){
                var s = document.createElement('script');
                s.src = 'https://fbl.embedwidgets.com/dcWK51Qwf6A51i8gEolc.js';
                document.body.appendChild(s);
            });
        </script>
    </section>

    <!-- Service Areas -->
    <section class="section-padding bg-gradient-surface">
        <div class="section-container">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">Service Areas Across <span class="text-primary">London & Essex</span></h2>
                <p class="text-xl text-muted-foreground max-w-3xl mx-auto">Professional cleaning services covering Greater London and Essex regions with fast response times</p>
            </div>

            <div class="max-w-6xl mx-auto">
                <!-- Mobile Layout - Stacked Cards -->
                <div class="block lg:hidden space-y-6">
                    <div class="bg-white rounded-2xl p-6 shadow-lg border">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                            <h3 class="text-xl font-bold text-foreground">London Coverage</h3>
                        </div>
                        <p class="text-lg font-semibold text-primary mb-2">All London areas within M25</p>
                        <p class="text-sm text-muted-foreground">Complete coverage of Greater London</p>
                    </div>
                    <div class="bg-white rounded-2xl p-6 shadow-lg border">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-4 h-4 bg-accent rounded-full animate-pulse delay-500"></div>
                            <h3 class="text-xl font-bold text-foreground">Essex Coverage</h3>
                        </div>
                        <p class="text-lg font-semibold text-accent mb-2">Essex areas</p>
                        <p class="text-sm text-muted-foreground">Major towns and surrounding areas</p>
                    </div>
                </div>

                <!-- Desktop Layout - Map with Overlaid Cards -->
                <div class="hidden lg:block relative bg-white rounded-3xl p-8 shadow-lg overflow-hidden">
                    <!-- Map Background -->
                    <div class="relative h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl overflow-hidden border-2 border-slate-200">
                        <!-- Map grid pattern -->
                        <div class="absolute inset-0 opacity-20">
                            <svg class="w-full h-full" viewBox="0 0 400 300">
                                <defs>
                                    <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#94a3b8" stroke-width="1"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                                <g opacity="0.3">
                                    <circle cx="120" cy="150" r="45" fill="#18A5A5" opacity="0.2"/>
                                    <circle cx="130" cy="140" r="35" fill="#18A5A5" opacity="0.3"/>
                                    <circle cx="110" cy="160" r="25" fill="#18A5A5" opacity="0.4"/>
                                    <ellipse cx="280" cy="120" rx="40" ry="50" fill="#185166" opacity="0.2"/>
                                    <ellipse cx="290" cy="110" rx="30" ry="35" fill="#185166" opacity="0.3"/>
                                    <ellipse cx="270" cy="130" rx="20" ry="25" fill="#185166" opacity="0.4"/>
                                </g>
                                <path d="M 160 150 Q 200 140 240 120" stroke="#94a3b8" stroke-width="3" fill="none" opacity="0.4"/>
                                <path d="M 140 170 Q 180 160 220 140" stroke="#94a3b8" stroke-width="2" fill="none" opacity="0.3"/>
                            </svg>
                        </div>

                        <!-- London Coverage Area -->
                        <div class="absolute left-8 top-1/2 transform -translate-y-1/2">
                            <div class="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border max-w-xs">
                                <div class="flex items-center gap-3 mb-4">
                                    <div class="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                                    <h3 class="text-xl font-bold text-foreground">London Coverage</h3>
                                </div>
                                <p class="text-lg font-semibold text-primary mb-2">All London areas within M25</p>
                                <p class="text-sm text-muted-foreground">Complete coverage of Greater London</p>
                            </div>
                        </div>

                        <!-- Essex Coverage Area -->
                        <div class="absolute right-8 top-1/3 transform -translate-y-1/2">
                            <div class="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border max-w-xs">
                                <div class="flex items-center gap-3 mb-4">
                                    <div class="w-4 h-4 bg-accent rounded-full animate-pulse delay-500"></div>
                                    <h3 class="text-xl font-bold text-foreground">Essex Coverage</h3>
                                </div>
                                <p class="text-lg font-semibold text-accent mb-2">Essex areas</p>
                                <p class="text-sm text-muted-foreground">Major towns and surrounding areas</p>
                            </div>
                        </div>

                        <!-- Connection line -->
                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                                <div class="w-20 h-0.5 bg-gradient-to-r from-primary to-accent animate-pulse delay-300"></div>
                                <div class="w-3 h-3 bg-accent rounded-full animate-pulse delay-500"></div>
                            </div>
                        </div>

                        <!-- Floating service indicators -->
                        <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md animate-float">
                            <div class="flex items-center gap-2">
                                <span class="text-primary">⏱️</span>
                                <span class="text-sm font-medium">Fast Response</span>
                            </div>
                        </div>
                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md animate-float">
                            <div class="flex items-center gap-2">
                                <span class="text-green-600">✔️</span>
                                <span class="text-sm font-medium">Guaranteed</span>
                            </div>
                        </div>
                        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md animate-float">
                            <div class="flex items-center gap-2">
                                <span class="text-accent">📍</span>
                                <span class="text-sm font-medium">Full Coverage</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Service Promise -->
            <div class="text-center mt-16">
                <div class="inline-flex items-center gap-4 bg-white px-8 py-4 rounded-2xl shadow-md">
                    <span class="text-green-600">✔️</span>
                    <span class="text-lg font-semibold text-foreground">Same-day quotes • 24/7 availability • Fully insured</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Recent Blog Posts Section -->
    <section class="section-padding bg-background">
        <div class="section-container">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">Latest <span class="text-primary">Cleaning Tips</span> & Insights</h2>
                <p class="text-xl text-muted-foreground max-w-3xl mx-auto">Stay updated with expert cleaning advice, industry insights, and helpful tips from our professional team</p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                <!-- Post 1 -->
                <article class="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
                    <div class="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/5 rounded-xl mb-6"></div>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between text-sm text-muted-foreground">
                            <span class="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Guides</span>
                            <div class="flex items-center gap-4">
                                <span>March 15, 2024</span>
                                <span>• 5 min read</span>
                            </div>
                        </div>
                        <h3 class="text-xl font-bold text-foreground">Ultimate End of Tenancy Cleaning Checklist</h3>
                        <p class="text-muted-foreground">Everything you need to know to get your full deposit back. Our comprehensive guide covers every room and essential cleaning task.</p>
                        <div class="text-primary font-medium">Read More →</div>
                    </div>
                </article>

                <!-- Post 2 -->
                <article class="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
                    <div class="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/5 rounded-xl mb-6"></div>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between text-sm text-muted-foreground">
                            <span class="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Tips</span>
                            <div class="flex items-center gap-4">
                                <span>March 10, 2024</span>
                                <span>• 3 min read</span>
                            </div>
                        </div>
                        <h3 class="text-xl font-bold text-foreground">Spring Cleaning Tips from Professional Cleaners</h3>
                        <p class="text-muted-foreground">Transform your home with expert tips and tricks from our professional cleaning team. Make your spring cleaning efficient and thorough.</p>
                        <div class="text-primary font-medium">Read More →</div>
                    </div>
                </article>

                <!-- Post 3 -->
                <article class="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
                    <div class="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/5 rounded-xl mb-6"></div>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between text-sm text-muted-foreground">
                            <span class="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Advice</span>
                            <div class="flex items-center gap-4">
                                <span>March 5, 2024</span>
                                <span>• 4 min read</span>
                            </div>
                        </div>
                        <h3 class="text-xl font-bold text-foreground">How to Choose the Right Cleaning Service</h3>
                        <p class="text-muted-foreground">Key factors to consider when selecting a professional cleaning service. Learn what questions to ask and red flags to avoid.</p>
                        <div class="text-primary font-medium">Read More →</div>
                    </div>
                </article>
            </div>

            <div class="text-center">
                <a href="#" class="inline-flex items-center justify-center border border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded-xl px-6 py-3">View All Blog Posts <span class="ml-2">→</span></a>
            </div>
        </div>
    </section>

    <!-- Call to Action -->
    <section class="section-padding bg-gradient-to-br from-primary via-primary-dark to-primary/80 text-white relative overflow-hidden">
        <div class="section-container relative z-10">
            <div class="max-w-4xl mx-auto text-center">
                <div class="mb-12">
                    <h2 class="text-4xl lg:text-6xl font-bold font-heading mb-6">
                        Ready for a <span class="bg-gradient-to-r from-white to-primary-glow bg-clip-text text-transparent">Spotless</span> Clean?
                    </h2>
                    <p class="text-xl lg:text-2xl text-white/95 max-w-3xl mx-auto leading-relaxed">
                        Join thousands of satisfied customers across London & Essex. Get your instant quote today and experience the difference professional cleaning makes.
                    </p>
                </div>

                <!-- Benefits Grid -->
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                    <div class="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl p-5 hover:bg-white/25 hover:scale-105 transition-all duration-300 border border-white/20">
                        <span>✅</span>
                        <span class="text-white font-medium">Free, no-obligation quotes</span>
                    </div>
                    <div class="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl p-5 hover:bg-white/25 hover:scale-105 transition-all duration-300 border border-white/20">
                        <span>✅</span>
                        <span class="text-white font-medium">Same-day booking available</span>
                    </div>
                    <div class="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl p-5 hover:bg-white/25 hover:scale-105 transition-all duration-300 border border-white/20">
                        <span>✅</span>
                        <span class="text-white font-medium">100% satisfaction guaranteed</span>
                    </div>
                    <div class="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl p-5 hover:bg-white/25 hover:scale-105 transition-all duration-300 border border-white/20">
                        <span>✅</span>
                        <span class="text-white font-medium">Fully insured & bonded</span>
                    </div>
                    <div class="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl p-5 hover:bg-white/25 hover:scale-105 transition-all duration-300 border border-white/20">
                        <span>✅</span>
                        <span class="text-white font-medium">Professional team</span>
                    </div>
                    <div class="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl p-5 hover:bg-white/25 hover:scale-105 transition-all duration-300 border border-white/20">
                        <span>✅</span>
                        <span class="text-white font-medium">Eco-friendly products</span>
                    </div>
                </div>

                <!-- CTA Button -->
                <div class="mb-16 flex justify-center">
                    <a href="#quote" class="bg-gradient-to-r from-white via-primary-glow/10 to-white text-primary hover:from-primary-glow hover:via-white hover:to-primary-glow hover:text-primary-dark text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-3xl font-bold shadow-2xl transform hover:scale-110 transition-all duration-500 flex items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-md sm:max-w-none border-2 border-white/20 hover:border-primary-glow/50 text-decoration-none">
                        <span class="text-xl sm:text-2xl font-extrabold">Get Instant Quote</span>
                        <span>→</span>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ Section -->
    <section class="section-padding bg-gradient-surface">
        <div class="section-container">
            <div class="text-center mb-12">
                <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Frequently Asked Questions
                </h2>
                <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Got questions? We've got answers. Here are the most common questions about our professional cleaning services.
                </p>
            </div>
            
            <div class="max-w-3xl mx-auto space-y-4">
                <details class="bg-card border border-border rounded-lg px-6">
                    <summary class="py-6 font-semibold text-foreground cursor-pointer">Which areas of London and Essex do you cover?</summary>
                    <div class="pb-6 text-muted-foreground leading-relaxed">
                        Our service area is extensive, covering all London boroughs within the M25 and a wide range of towns across Essex. Our dedicated local teams are positioned throughout the capital to provide a fast and reliable service, whether you are in North, South, East, West, or Central London. Essentially, if your property is within the M25 motorway or our key Essex regions, we have you covered. For a detailed list of postcodes, please see our Areas We Serve page.
                    </div>
                </details>

                <details class="bg-card border border-border rounded-lg px-6">
                    <summary class="py-6 font-semibold text-foreground cursor-pointer">What's included in a standard professional cleaning service?</summary>
                    <div class="pb-6 text-muted-foreground leading-relaxed">
                        <p>Our standard cleaning services (such as Domestic Cleaning and Deep Cleaning) are designed to be thorough and comprehensive. While every home is unique, our service always includes a detailed clean of all rooms. We don't just tidy; we deep clean. This includes:</p>
                        <ul class="list-disc list-inside mt-4 space-y-2">
                            <li><strong>Kitchen:</strong> Wiping all surfaces and cabinet fronts, cleaning the hob and extractor fan, cleaning the microwave inside and out, scrubbing the sink and taps, and vacuuming/mopping the floor.</li>
                            <li><strong>Bathrooms:</strong> Fully sanitising the toilet, shower, and bath, descaling taps and showerheads, cleaning all mirrors and glass, and washing the floor.</li>
                            <li><strong>Bedrooms & Living Areas:</strong> Dusting all surfaces (including skirting boards and light fittings), polishing any wooden furniture, cleaning internal windows, and thoroughly vacuuming all carpets and mopping hard floors.</li>
                        </ul>
                    </div>
                </details>

                <details class="bg-card border border-border rounded-lg px-6">
                    <summary class="py-6 font-semibold text-foreground cursor-pointer">Are your cleaners insured, background-checked, and employed by you?</summary>
                    <div class="pb-6 text-muted-foreground leading-relaxed">
                        Yes, and we believe this is one of the most important factors in choosing a cleaning service. For your peace of mind, every member of our team is a direct employee, not a temporary contractor. They each undergo a rigorous vetting process which includes identity verification, background checks, and reference checks. Furthermore, we are fully covered by comprehensive public liability insurance, protecting your home and belongings against any accidental damage.
                    </div>
                </details>

                <details class="bg-card border border-border rounded-lg px-6">
                    <summary class="py-6 font-semibold text-foreground cursor-pointer">Do I need to provide any cleaning equipment or supplies?</summary>
                    <div class="pb-6 text-muted-foreground leading-relaxed">
                        No, you don't need to provide a thing. Our professional cleaners arrive at your property fully equipped with all the necessary high-quality equipment, from professional-grade vacuum cleaners to specialised tools. We also bring our own range of effective, safe, and eco-friendly cleaning products to ensure a perfect finish every time.
                    </div>
                </details>
            </div>
        </div>
    </section>
</div>

<?php include ESN_TEMPLATES_PLUGIN_PATH . 'templates/footer-esn.php'; ?>

<?php wp_footer(); ?>
</body>
</html>
