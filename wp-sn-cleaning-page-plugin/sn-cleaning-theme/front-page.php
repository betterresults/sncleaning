<?php
/**
 * Homepage Template (Front Page)
 * Exact replica of React Homepage
 * 
 * @package SN_Cleaning
 */

get_header();

$options = get_option('sn_theme_options', array());
?>

<main id="main-content" class="min-h-screen bg-background">
    
    <!-- Hero Section - Exact from HomepageHeroSection.tsx -->
    <section class="relative min-h-screen flex items-center overflow-hidden">
        <!-- Background Image with Overlay -->
        <div class="absolute inset-0 z-0" style="background-image: linear-gradient(135deg, rgba(28, 60, 80, 0.9), rgba(24, 81, 102, 0.85)), url(<?php echo get_template_directory_uri(); ?>/assets/images/hero-kitchen.jpg); background-size: cover; background-position: center center; background-attachment: fixed;"></div>
        
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
                            <svg class="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            <span class="font-semibold text-xs lg:text-sm">Fully Insured</span>
                        </div>
                        <div class="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                            <svg class="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                            <span class="font-semibold text-xs lg:text-sm">5-Star Rated</span>
                        </div>
                        <div class="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                            <svg class="w-4 h-4 lg:w-5 lg:h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="font-semibold text-xs lg:text-sm">Same-Day Service</span>
                        </div>
                        <div class="flex items-center gap-2 lg:gap-3 bg-white/20 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-full">
                            <svg class="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span class="font-semibold text-xs lg:text-sm">Local Experts</span>
                        </div>
                    </div>
                </div>

                <!-- Quote Form -->
                <div class="lg:col-span-2 animate-fade-in-delayed">
                    <!-- Desktop Form -->
                    <div class="hidden lg:block bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 lg:p-8 max-w-md mx-auto lg:ml-auto lg:mr-0 border border-gray-200">
                        <div class="text-center mb-6">
                            <h3 class="text-3xl font-bold font-heading text-gray-900 mb-3">
                                Get Your Instant Quote
                            </h3>
                        </div>

                        <form action="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" method="get" class="space-y-4">
                            <div class="flex items-center bg-gray-100 rounded-xl border-2 border-gray-200 shadow-sm px-4 py-3">
                                <svg class="w-6 h-6 text-teal-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <input type="text" name="postcode" placeholder="Enter your postcode" class="border-0 bg-transparent text-lg placeholder:text-gray-500 focus:outline-none p-0 font-medium w-full text-gray-900" />
                            </div>
                            
                            <button type="submit" class="w-full h-14 text-lg bg-white hover:bg-gray-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" style="color: #185166;">
                                Get Instant Quote
                                <span class="ml-2">→</span>
                            </button>
                        </form>
                    </div>

                    <!-- Mobile Form -->
                    <div class="lg:hidden w-full max-w-2xl mx-auto">
                        <form action="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" method="get" class="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-gray-200">
                            <div class="text-center mb-4">
                                <h3 class="text-2xl font-bold font-heading text-gray-900">
                                    Get Your Quote
                                </h3>
                            </div>
                            <div class="flex items-center bg-gray-100 rounded-xl border-2 border-gray-200 shadow-sm px-4 py-3 mb-4">
                                <svg class="w-6 h-6 text-teal-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <input type="text" name="postcode" placeholder="Enter your postcode" class="border-0 bg-transparent text-base placeholder:text-gray-500 focus:outline-none p-0 font-medium w-full text-gray-900" />
                            </div>
                            <button type="submit" class="w-full h-12 text-base bg-white hover:bg-gray-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" style="color: #185166;">
                                Get Instant Quote
                                <span class="ml-2">→</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Service Types Section - Exact from HomepageServiceTypesSection.tsx -->
    <section class="section-padding bg-gradient-to-b from-muted/30 to-background">
        <div class="section-container">
            <!-- Residential Services -->
            <div class="mb-20">
                <div class="text-center mb-16">
                    <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
                        Residential Cleaning Services
                    </h2>
                    <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Professional home cleaning solutions with real people who care about your space
                    </p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <?php
                    $residential_services = array(
                        array('title' => 'End of Tenancy', 'description' => 'Complete move-out cleaning to get your deposit back with professional standards and equipment.', 'image' => 'end-of-tenancy-cleaning.jpg'),
                        array('title' => 'After Builders', 'description' => 'Post-construction cleanup and dust removal including paint splatter cleaning and surface restoration.', 'image' => 'after-builders-cleaning.jpg'),
                        array('title' => 'Domestic Cleaning', 'description' => 'Regular weekly, fortnightly or monthly home cleaning with flexible scheduling and consistent quality.', 'image' => 'domestic-cleaning.jpg'),
                        array('title' => 'Airbnb Cleaning', 'description' => 'Turnaround cleaning for short-term rentals with quick service and guest-ready standards.', 'image' => 'airbnb-cleaning.jpg'),
                        array('title' => 'Deep House Cleaning', 'description' => 'Comprehensive one-time deep cleaning service covering every corner and inside appliances.', 'image' => 'domestic-cleaning.jpg'),
                        array('title' => 'Carpet Cleaning', 'description' => 'Professional carpet and upholstery cleaning with steam cleaning and fast drying technology.', 'image' => 'carpet-cleaning.jpg')
                    );
                    
                    foreach ($residential_services as $service) :
                    ?>
                        <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                            <div class="relative h-48 overflow-hidden">
                                <img src="<?php echo get_template_directory_uri(); ?>/assets/images/<?php echo $service['image']; ?>" alt="<?php echo esc_attr($service['title']); ?> cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            
                            <div class="p-6 space-y-4">
                                <h3 class="text-2xl font-bold text-foreground group-hover:text-primary transition-colors"><?php echo esc_html($service['title']); ?></h3>
                                <p class="text-muted-foreground leading-relaxed"><?php echo esc_html($service['description']); ?></p>
                                
                                <button class="w-full mt-6 px-4 py-2 border border-input rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-colors flex items-center justify-center gap-2">
                                    Learn More
                                    <span class="group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Commercial Services -->
            <div>
                <div class="text-center mb-16">
                    <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
                        Commercial Cleaning Services
                    </h2>
                    <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Professional business cleaning with experienced teams you can trust
                    </p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <?php
                    $commercial_services = array(
                        array('title' => 'Office Cleaning', 'description' => 'Professional office maintenance and sanitization with daily or weekly service options.'),
                        array('title' => 'School Cleaning', 'description' => 'Educational facility cleaning with child-safe products and classroom sanitization.'),
                        array('title' => 'Nursery Cleaning', 'description' => 'Specialized cleaning for childcare facilities using only non-toxic products.'),
                        array('title' => 'Retail Cleaning', 'description' => 'Specialized cleaning for retail environments with customer-friendly hours.')
                    );
                    
                    foreach ($commercial_services as $service) :
                    ?>
                        <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                            <div class="relative h-48 overflow-hidden">
                                <img src="<?php echo get_template_directory_uri(); ?>/assets/images/office-cleaning.jpg" alt="<?php echo esc_attr($service['title']); ?> cleaning service" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            
                            <div class="p-6 space-y-4">
                                <h3 class="text-xl font-bold text-foreground group-hover:text-primary transition-colors"><?php echo esc_html($service['title']); ?></h3>
                                <p class="text-muted-foreground text-sm leading-relaxed"><?php echo esc_html($service['description']); ?></p>
                                
                                <button class="btn-hero w-full mt-4">
                                    Get Quote
                                    <span class="ml-2">→</span>
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <?php get_template_part('template-parts/homepage-features'); ?>

    <!-- Simple Booking Process -->
    <?php get_template_part('template-parts/homepage-booking'); ?>

    <!-- Testimonials Section -->
    <?php get_template_part('template-parts/homepage-testimonials'); ?>

    <!-- Service Areas Section -->
    <?php get_template_part('template-parts/homepage-service-areas'); ?>

    <!-- Recent Blog Posts Section -->
    <?php get_template_part('template-parts/homepage-blog'); ?>

    <!-- Ready for Spotless Clean CTA Section -->
    <?php get_template_part('template-parts/homepage-cta'); ?>

    <!-- FAQ Section -->
    <?php get_template_part('template-parts/homepage-faq'); ?>

</main>

<?php get_footer(); ?>
