<?php
/**
 * Template Name: End of Tenancy Cleaning
 *
 * Reusable service page using dynamic fields matching the ESN plugin
 * @package SN_Cleaning
 */

get_header();

$ID = get_the_ID();

// SEO - title and meta description from plugin fields
$page_title        = get_post_meta($ID, '_page_title', true);
$meta_description  = get_post_meta($ID, '_meta_description', true);
if ($page_title) {
    add_filter('pre_get_document_title', function() use ($page_title) { return esc_html($page_title); });
}
if ($meta_description) {
    add_action('wp_head', function() use ($meta_description) {
        echo '<meta name="description" content="' . esc_attr($meta_description) . '">' . "\n";
    }, 1);
}

// Hero fields (plugin first, then theme fallbacks)
$hero_h1          = get_post_meta($ID, '_page_h1', true) ?: get_post_meta($ID, '_hero_h1', true) ?: 'End of Tenancy Cleaning';
$under_heading    = get_post_meta($ID, '_under_heading', true) ?: get_post_meta($ID, '_hero_subheading', true) ?: 'Professional end of tenancy cleaning with 99.8% deposit return rate';
$hero_image       = get_post_meta($ID, '_hero_image', true);
$hero_image_alt   = get_post_meta($ID, '_hero_image_alt', true) ?: 'End of tenancy cleaning hero';
$hero_image_desc  = get_post_meta($ID, '_hero_image_desc', true) ?: '';
$hero_bg_url      = $hero_image ? $hero_image : get_template_directory_uri() . '/assets/images/hero-kitchen.jpg';

// About/Why-us support fields
$page_subheading             = get_post_meta($ID, '_page_subheading', true) ?: '';
$page_subheading_description = get_post_meta($ID, '_page_subheading_description', true) ?: '';

// Optional content image
$page_image      = get_post_meta($ID, '_page_image', true);
$page_image_alt  = get_post_meta($ID, '_page_image_alt', true) ?: 'Professional cleaner';
$page_image_desc = get_post_meta($ID, '_page_image_desc', true) ?: '';
$page_image_url  = $page_image ? $page_image : get_template_directory_uri() . '/assets/images/professional-cleaner.jpg';

// Main content headings
$page_h2            = get_post_meta($ID, '_page_h2', true) ?: 'Expert End of Tenancy Cleaning Services';
$page_h2_paragraph  = get_post_meta($ID, '_page_h2_paragraph', true) ?: 'Our professional cleaning team ensures your property meets the highest standards for deposit return.';
$page_h3            = get_post_meta($ID, '_page_h3', true) ?: 'Why Choose Our Service?';
$page_h3_paragraph  = get_post_meta($ID, '_page_h3_paragraph', true) ?: 'We provide exceptional cleaning services with guaranteed results.';
$page_h4            = get_post_meta($ID, '_page_h4', true) ?: 'What Makes Us Different';
$page_h4_paragraph_1= get_post_meta($ID, '_page_h4_paragraph_1', true) ?: 'With years of experience and professional equipment, we deliver exceptional results.';
$page_h4_paragraph_2= get_post_meta($ID, '_page_h4_paragraph_2', true) ?: 'Our eco-friendly products ensure a safe clean for you and the environment.';

// Service area (prefer _page_area, fallback to _page_borough)
$page_area    = get_post_meta($ID, '_page_area', true);
$page_borough = get_post_meta($ID, '_page_borough', true);
$service_area = $page_area ?: ($page_borough ?: 'London');

// FAQ
$page_question_1 = get_post_meta($ID, '_page_question_1', true);
$page_answer_1   = get_post_meta($ID, '_page_answer_1', true);
$page_question_2 = get_post_meta($ID, '_page_question_2', true);
$page_answer_2   = get_post_meta($ID, '_page_answer_2', true);
?>

<main id="main-content" class="min-h-screen bg-background">
    
    <section class="relative min-h-screen flex items-center overflow-hidden">
        <!-- Background Image with Overlay -->
        <div class="absolute inset-0 z-0" style="background-image: linear-gradient(135deg, rgba(28, 60, 80, 0.9), rgba(24, 81, 102, 0.85)), url('<?php echo esc_url($hero_bg_url); ?>'); background-size: cover; background-position: center center; background-attachment: fixed;"></div>

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
                        <h1 class="text-5xl lg:text-7xl font-bold font-heading leading-tight text-center lg:text-left">
                            <span class="block bg-yellow-300/20 px-2 py-1 rounded"><?php echo esc_html($hero_h1); ?></span>
                        </h1>
                        <p class="text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl">
                            <span class="bg-yellow-300/20 px-2 py-1 rounded"><?php echo esc_html($under_heading); ?></span>
                        </p>
                    </div>

                    <!-- Trust Badges -->
                    <div class="flex flex-wrap gap-6 pt-4">
                        <div class="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                            <span class="inline-block w-6 h-6 text-yellow-400">🛡️</span>
                            <span class="font-semibold">100% Deposit Guarantee</span>
                        </div>
                        <div class="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                            <span class="inline-block w-6 h-6 text-yellow-400">⭐</span>
                            <span class="font-semibold">5-Star Local Rating</span>
                        </div>
                    </div>
                </div>

                <!-- Quote Form -->
                <div class="lg:col-span-2 animate-fade-in-delayed">
                    <!-- Desktop Form -->
                    <div class="hidden lg:block card-glass p-6 lg:p-8 max-w-md mx-auto lg:ml-auto lg:mr-0">
                        <div class="text-center mb-6">
                            <h3 class="text-3xl font-bold font-heading text-foreground mb-3">Get Your Instant Quote</h3>
                        </div>
                        <div class="space-y-4">
                            <div class="flex items-center bg-background rounded-xl border-2 border-input shadow-sm px-4 py-3">
                                <span class="w-6 h-6 text-primary mr-3">📍</span>
                                <input id="postcode-desktop" type="text" placeholder="Enter a postcode here" class="border-0 bg-transparent text-lg placeholder:text-gray-400 focus:outline-none focus:ring-0 p-0 font-medium w-full" />
                            </div>
                            <a href="#" id="hero-cta-desktop" class="btn-hero block w-full h-14 text-lg font-semibold rounded-xl text-center flex items-center justify-center">Check Prices & Availability</a>
                        </div>
                    </div>

                    <!-- Mobile Form -->
                    <div class="lg:hidden w-full max-w-2xl mx-auto">
                        <div class="bg-background rounded-2xl p-3 shadow-xl border border-input">
                            <div class="flex items-center px-4 py-3">
                                <span class="w-6 h-6 text-primary mr-3">📍</span>
                                <input id="postcode-mobile" type="text" placeholder="Enter a postcode here" class="border-0 bg-transparent text-lg placeholder:text-gray-400 focus:outline-none focus:ring-0 p-0 font-medium w-full" />
                            </div>
                            <a href="#" id="hero-cta-mobile" class="btn-hero block w-full h-12 text-base mt-2 text-center rounded-xl font-semibold">Check Prices & Availability</a>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Hidden image for SEO semantics when background is used -->
            <img src="<?php echo esc_url($hero_bg_url); ?>" alt="<?php echo esc_attr($hero_image_alt); ?>" class="sr-only" />
            <?php if ($hero_image_desc): ?>
                <p class="sr-only"><?php echo esc_html($hero_image_desc); ?></p>
            <?php endif; ?>
        </div>

        <script>
            document.addEventListener('DOMContentLoaded', function() {
                function goToBooking(postcode) {
                    var url = '<?php echo esc_js(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>';
                    if (postcode) { url += '?postcode=' + encodeURIComponent(postcode); }
                    window.location.href = url;
                }
                var desktopBtn = document.getElementById('hero-cta-desktop');
                var mobileBtn = document.getElementById('hero-cta-mobile');
                desktopBtn && desktopBtn.addEventListener('click', function(e){ e.preventDefault(); var v = (document.getElementById('postcode-desktop') || {}).value; goToBooking(v); });
                mobileBtn && mobileBtn.addEventListener('click', function(e){ e.preventDefault(); var v = (document.getElementById('postcode-mobile') || {}).value; goToBooking(v); });
            });
        </script>
    </section>

    <!-- H2 Section with Stats -->
    <section class="section-padding bg-background">
        <div class="section-container">
            <div class="max-w-4xl mx-auto text-center space-y-12">
                <div class="space-y-6">
                    <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight"><?php echo esc_html($page_h2); ?></h2>
                    <p class="text-lg text-muted-foreground leading-relaxed"><?php echo wp_kses_post($page_h2_paragraph); ?></p>
                </div>
                <!-- Stats Grid -->
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div class="text-center p-6 bg-gradient-surface rounded-2xl">
                        <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl">⭐</span>
                        </div>
                        <div class="text-3xl font-bold text-primary mb-2">8,000+</div>
                        <div class="text-muted-foreground font-medium">Happy Customers</div>
                    </div>
                    <div class="text-center p-6 bg-gradient-surface rounded-2xl">
                        <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl">🏆</span>
                        </div>
                        <div class="text-3xl font-bold text-primary mb-2">99.8%</div>
                        <div class="text-muted-foreground font-medium">Success Rate</div>
                    </div>
                    <div class="text-center p-6 bg-gradient-surface rounded-2xl">
                        <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl">👥</span>
                        </div>
                        <div class="text-3xl font-bold text-primary mb-2">49</div>
                        <div class="text-muted-foreground font-medium">Expert Cleaners</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Process Section (3-Step Process) -->
    <section class="section-padding bg-background">
        <div class="section-container">
            <div class="text-center mb-16">
                <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">Our <span class="text-primary">3-Step Process</span></h2>
                <p class="text-xl text-muted-foreground max-w-3xl mx-auto">From booking to completion, we make the entire process simple and stress-free</p>
            </div>
            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Step 1 -->
                <div class="relative">
                    <div class="hidden lg:block absolute top-16 -right-4 w-8 h-0.5 bg-primary/30 z-0"></div>
                    <div class="card-glass p-6 text-center relative z-10 hover:shadow-lg transition-all duration-300">
                        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">01</div>
                        </div>
                        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
                            <span class="text-3xl">📅</span>
                        </div>
                        <h3 class="text-xl font-bold text-foreground mb-4">Book Your Service</h3>
                        <p class="text-muted-foreground leading-relaxed">Choose your preferred date and time. We offer flexible scheduling including weekends and same-day service.</p>
                    </div>
                </div>
                <!-- Step 2 -->
                <div class="relative">
                    <div class="hidden lg:block absolute top-16 -right-4 w-8 h-0.5 bg-primary/30 z-0"></div>
                    <div class="card-glass p-6 text-center relative z-10 hover:shadow-lg transition-all duration-300">
                        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">02</div>
                        </div>
                        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
                            <span class="text-3xl">✨</span>
                        </div>
                        <h3 class="text-xl font-bold text-foreground mb-4">Meet Our Cleaner</h3>
                        <p class="text-muted-foreground leading-relaxed">Our professional team arrives on time with all equipment and conducts a thorough assessment of your property.</p>
                    </div>
                </div>
                <!-- Step 3 -->
                <div class="relative">
                    <div class="card-glass p-6 text-center relative z-10 hover:shadow-lg transition-all duration-300">
                        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">03</div>
                        </div>
                        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
                            <span class="text-3xl">👍</span>
                        </div>
                        <h3 class="text-xl font-bold text-foreground mb-4">Enjoy Your Deposit Back</h3>
                        <p class="text-muted-foreground leading-relaxed">Relax knowing your property meets agency standards and your deposit is secure with our guarantee.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Why Choose Us -->
    <section class="section-padding" style="background: linear-gradient(135deg, #1c3c50, #185166, #1c3c50);">
        <div class="section-container">
            <div class="space-y-16">
                <div class="text-center">
                    <h3 class="text-4xl lg:text-5xl font-bold font-heading text-white leading-tight mb-6"><?php echo esc_html($page_h3); ?></h3>
                </div>
                <div class="grid lg:grid-cols-2 gap-16 items-start">
                    <!-- Image -->
                    <div class="relative">
                        <div class="relative overflow-hidden rounded-3xl">
                            <div class="absolute -top-8 -left-8 w-full h-full rounded-3xl opacity-20 z-0" style="background: linear-gradient(135deg,#185166,#2a7a9e);"></div>
                            <div class="relative z-10 bg-white p-4 rounded-3xl shadow-xl">
                                <img src="<?php echo esc_url($page_image_url); ?>" alt="<?php echo esc_attr($page_image_alt); ?>" class="w-full h-96 object-cover rounded-2xl" />
                                <?php if ($page_image_desc): ?>
                                    <p class="sr-only"><?php echo esc_html($page_image_desc); ?></p>
                                <?php endif; ?>
                            </div>
                            <?php if ($page_subheading): ?>
                            <div class="absolute bottom-4 right-4 bg-white rounded-2xl p-4 shadow-lg z-20">
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 bg-green-500 rounded-full" style="animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
                                    <span class="text-sm font-semibold text-slate-800"><?php echo esc_html($page_subheading); ?></span>
                                </div>
                            </div>
                            <?php endif; ?>
                        </div>
                    </div>
                    <!-- Paragraph -->
                    <div class="p-6 bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                        <?php if ($page_subheading_description): ?>
                            <p class="text-slate-200 mb-4"><?php echo wp_kses_post($page_subheading_description); ?></p>
                        <?php endif; ?>
                        <p class="text-lg text-slate-300 leading-relaxed"><?php echo wp_kses_post($page_h3_paragraph); ?></p>
                    </div>
                </div>
                <!-- Feature cards -->
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="p-6 bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 text-center">
                        <div class="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4"><span class="text-2xl">🛡️</span></div>
                        <h4 class="text-xl font-semibold font-heading text-white">Deposit Back Guarantee</h4>
                        <p class="text-slate-300 mt-2">Our 72-hour re-clean guarantee means if there's an issue, we return and fix it free of charge.</p>
                    </div>
                    <div class="p-6 bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 text-center">
                        <div class="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4"><span class="text-2xl">👥</span></div>
                        <h4 class="text-xl font-semibold font-heading text-white">Professionally Trained Team</h4>
                        <p class="text-slate-300 mt-2">Full-time, vetted and insured staff trained on an agency-approved checklist.</p>
                    </div>
                    <div class="p-6 bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 text-center">
                        <div class="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4"><span class="text-2xl">✓</span></div>
                        <h4 class="text-xl font-semibold font-heading text-white">Agency-Approved Standards</h4>
                        <p class="text-slate-300 mt-2">Strict protocols that satisfy letting agents and property managers.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials -->
    <?php get_template_part('template-parts/homepage', 'testimonials'); ?>

    <!-- Checklist Section -->
    <section class="section-padding bg-background">
        <div class="section-container">
            <div class="text-center mb-16 space-y-6">
                <div class="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full">
                    <span class="text-xl">✨</span>
                    <span class="text-primary font-semibold">Professional Deep Clean</span>
                </div>
                <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">A Checklist That Leaves <span class="text-primary">Nothing to Chance</span></h2>
                <p class="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">We clean everything. Our comprehensive service ensures every corner of your property meets the highest standards for final inspection.</p>
            </div>

            <div class="space-y-8">
                <!-- First Row - 3 sections -->
                <div class="grid lg:grid-cols-3 gap-8">
                    <!-- Kitchen -->
                    <div class="bg-white rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-all duration-300 group">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span class="text-2xl">👨‍🍳</span>
                            </div>
                            <h4 class="text-xl font-bold font-heading text-foreground">Kitchen Deep Clean</h4>
                        </div>
                        <ul class="space-y-3">
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">All worktops cleaned and degreased</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Cupboards cleaned inside, outside and on top</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Sink and taps descaled to shine</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Oven deep cleaned including trays and hob</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Fridge/freezer cleaned inside and out</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Dishwasher cleaned inside and outside</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Washing machine drawer and seals cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Microwave and appliances cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Windows, sills and handles cleaned</span></li>
                        </ul>
                    </div>

                    <!-- Bathroom -->
                    <div class="bg-white rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-all duration-300 group">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span class="text-2xl">🛁</span>
                            </div>
                            <h4 class="text-xl font-bold font-heading text-foreground">Bathroom Sanitisation</h4>
                        </div>
                        <ul class="space-y-3">
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Bath, shower and screen descaled</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Toilet disinfected inside and out</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Sink and taps cleaned and descaled</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">All tiles and grout deep cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Mirrors and glass surfaces polished</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Extractor fan and vents cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Skirting boards wiped clean</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Radiators and light fittings dusted</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Floors vacuumed and mopped</span></li>
                        </ul>
                    </div>

                    <!-- Bedrooms -->
                    <div class="bg-white rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-all duration-300 group">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span class="text-2xl">🛏️</span>
                            </div>
                            <h4 class="text-xl font-bold font-heading text-foreground">Bedrooms</h4>
                        </div>
                        <ul class="space-y-3">
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Wardrobes cleaned inside, outside, and on top</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Furniture moved and cleaned behind</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Drawers and bedside tables detailed clean</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Windows and sills cleaned thoroughly</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Light switches and sockets wiped</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Skirting boards detailed clean</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Radiators cleaned behind and around</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Carpets deep cleaned or floors mopped</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Cobwebs removed from all corners</span></li>
                        </ul>
                    </div>
                </div>

                <!-- Second Row - 3 sections -->
                <div class="grid lg:grid-cols-3 gap-8">
                    <!-- Living Areas -->
                    <div class="bg-white rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-all duration-300 group">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span class="text-2xl">🏠</span>
                            </div>
                            <h4 class="text-xl font-bold font-heading text-foreground">Living Areas</h4>
                        </div>
                        <ul class="space-y-3">
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">All furniture moved and cleaned behind</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">TV units cleaned inside and out</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Sofas vacuumed underneath</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Coffee tables detailed clean</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Bookshelves dusted inside and out</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Windows and frames cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Light switches and sockets wiped</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Skirting boards cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Carpets deep cleaned or floors mopped</span></li>
                        </ul>
                    </div>

                    <!-- Hallways -->
                    <div class="bg-white rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-all duration-300 group">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span class="text-2xl">🏢</span>
                            </div>
                            <h4 class="text-xl font-bold font-heading text-foreground">Hallways & Stairs</h4>
                        </div>
                        <ul class="space-y-3">
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">All skirting boards and door frames cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Light switches and sockets wiped</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Stairs and banisters thoroughly cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Storage cupboards cleaned inside and out</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Mirrors and glass surfaces polished</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Radiators dusted and cleaned behind</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Hard floors mopped or carpets cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Cobwebs removed from corners</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Entry doors and handles cleaned</span></li>
                        </ul>
                    </div>

                    <!-- General Areas -->
                    <div class="bg-white rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-all duration-300 group">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span class="text-2xl">✨</span>
                            </div>
                            <h4 class="text-xl font-bold font-heading text-foreground">General Areas</h4>
                        </div>
                        <ul class="space-y-3">
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">All windows cleaned inside</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Window sills and frames detailed</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Internal doors and handles wiped</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Light fittings and ceiling fans dusted</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Picture rails and architraves cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Electrical sockets and switches wiped</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Carpets professionally cleaned</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Hard floors vacuumed and mopped</span></li>
                            <li class="flex items-start gap-3"><div class="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5"><span class="text-primary text-xs">✓</span></div><span class="text-muted-foreground leading-relaxed">Final inspection and touch-ups</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Content H4 section -->
    <section class="section-padding bg-gradient-to-r from-muted/30 via-background to-muted/30 border-y border-border/50">
        <div class="section-container">
            <div class="text-center mb-16">
                <div class="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6" style="background-color: rgba(24,81,102,0.1);">
                    <span class="text-2xl">✨</span>
                    <span style="color:#185166;" class="font-semibold">Why Choose Us</span>
                </div>
                <h4 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6"><?php echo esc_html($page_h4); ?></h4>
            </div>
            <div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
                <div class="bg-white border rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background-color:#185166;"><span class="text-2xl">⭐</span></div>
                        <h3 class="text-2xl font-bold text-foreground">Premium Standards</h3>
                    </div>
                    <p class="text-lg text-muted-foreground leading-relaxed"><?php echo wp_kses_post($page_h4_paragraph_1); ?></p>
                </div>
                <div class="bg-white border rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background-color:#185166;"><span class="text-2xl">✨</span></div>
                        <h3 class="text-2xl font-bold text-foreground">Trusted Professionals</h3>
                    </div>
                    <p class="text-lg text-muted-foreground leading-relaxed"><?php echo wp_kses_post($page_h4_paragraph_2); ?></p>
                </div>
            </div>
        </div>
    </section>

    <!-- Service Areas -->
    <section class="section-padding bg-muted/20">
        <div class="section-container">
            <div class="text-center mb-12">
                <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">Areas in <?php echo esc_html($service_area); ?> We <span class="text-primary">Cover</span></h2>
                <p class="text-xl text-muted-foreground max-w-3xl mx-auto">Professional cleaning services across <?php echo esc_html($service_area); ?></p>
            </div>
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-2xl p-8 shadow-lg border">
                    <p class="text-center text-muted-foreground mb-4">We provide end of tenancy cleaning services in <?php echo esc_html($service_area); ?> and surrounding areas.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Guarantee Section -->
    <section class="section-padding bg-gradient-to-br from-foreground via-primary-dark to-foreground text-white relative overflow-hidden">
        <!-- Background decoration -->
        <div class="absolute inset-0">
            <div class="absolute top-10 right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <div class="absolute bottom-20 left-20 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
        </div>
        
        <div class="section-container relative z-10">
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <!-- Icon -->
                <div class="lg:col-span-3 text-center lg:text-left">
                    <div class="inline-flex items-center justify-center w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-primary to-primary-light rounded-3xl shadow-glow mx-auto lg:mx-0">
                        <span class="text-5xl lg:text-6xl">🛡️</span>
                    </div>
                </div>

                <!-- Content -->
                <div class="lg:col-span-9 space-y-6 lg:space-y-8">
                    <div class="space-y-4">
                        <h3 class="text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-center lg:text-left">Our Cast-Iron <span class="text-primary">Guarantee</span></h3>
                        <p class="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed text-center lg:text-left">Your deposit is our priority. We are so confident in our agency-approved standards that we offer a rock-solid guarantee: in the unlikely event of any issues flagged in your checkout report, we will return to the property to rectify them <span class="font-bold text-primary">completely free of charge</span> within 72 hours.</p>
                    </div>

                    <!-- Guarantee features -->
                    <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                        <div class="flex items-center gap-3 lg:gap-4 bg-white/10 backdrop-blur-sm p-3 lg:p-4 rounded-xl">
                            <span class="text-2xl lg:text-3xl flex-shrink-0">✓</span>
                            <div>
                                <h4 class="font-semibold text-base lg:text-lg">No Arguments</h4>
                                <p class="text-white/80 text-xs lg:text-sm">Instant resolution</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-3 lg:gap-4 bg-white/10 backdrop-blur-sm p-3 lg:p-4 rounded-xl">
                            <span class="text-2xl lg:text-3xl flex-shrink-0">⏱️</span>
                            <div>
                                <h4 class="font-semibold text-base lg:text-lg">72-Hour Return</h4>
                                <p class="text-white/80 text-xs lg:text-sm">Quick response time</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-3 lg:gap-4 bg-white/10 backdrop-blur-sm p-3 lg:p-4 rounded-xl sm:col-span-2 md:col-span-1">
                            <span class="text-2xl lg:text-3xl flex-shrink-0">🛡️</span>
                            <div>
                                <h4 class="font-semibold text-base lg:text-lg">100% Free</h4>
                                <p class="text-white/80 text-xs lg:text-sm">No additional costs</p>
                            </div>
                        </div>
                    </div>

                    <!-- CTA -->
                    <div class="pt-4 lg:pt-6 text-center lg:text-left">
                        <a href="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" class="inline-block bg-primary hover:bg-primary/90 text-primary-foreground text-lg lg:text-xl px-8 lg:px-12 py-4 lg:py-6 rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">Book Your Guaranteed Clean</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ -->
    <section class="section-padding bg-muted/20">
        <div class="section-container max-w-4xl mx-auto">
            <div class="text-center mb-12">
                <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">Frequently Asked <span class="text-primary">Questions</span></h2>
                <p class="text-xl text-muted-foreground">Everything you need to know about our end of tenancy cleaning service</p>
            </div>

            <?php
            $default_faqs = array(
                array('q' => 'How long does an end of tenancy clean take?', 'a' => 'A typical end of tenancy clean for a 2-bedroom property takes 3-5 hours, depending on the size and condition. Larger properties or those requiring deep cleaning may take longer.'),
                array('q' => 'What if my landlord or agent requests re-cleaning?', 'a' => 'We offer a 72-hour guarantee. If your landlord or letting agent isn\'t satisfied with any aspect of the clean, we\'ll return and re-clean the specified areas completely free of charge.'),
                array('q' => 'Do I need to be present during the clean?', 'a' => 'No, you don\'t need to be present. We just need access to the property. You can drop off keys, provide access codes, or arrange for someone to let us in.'),
                array('q' => 'What areas are covered in an end of tenancy clean?', 'a' => 'We clean every room thoroughly - kitchen (including oven and appliances), bathrooms, bedrooms, living areas, hallways, and all general areas. We follow a comprehensive checklist to ensure nothing is missed.'),
                array('q' => 'Do you bring your own cleaning equipment and products?', 'a' => 'Yes, our professional team arrives fully equipped with all necessary cleaning supplies, equipment, and eco-friendly products. You don\'t need to provide anything.')
            );
            ?>

            <div class="space-y-4">
                <?php if ($page_question_1 && $page_answer_1): ?>
                <details class="bg-white rounded-2xl shadow-sm border group">
                    <summary class="p-6 cursor-pointer font-bold text-lg text-foreground flex items-center justify-between hover:text-primary transition-colors">
                        <span><?php echo esc_html($page_question_1); ?></span>
                        <span class="text-2xl group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div class="px-6 pb-6 text-muted-foreground"><?php echo wp_kses_post($page_answer_1); ?></div>
                </details>
                <?php endif; ?>

                <?php if ($page_question_2 && $page_answer_2): ?>
                <details class="bg-white rounded-2xl shadow-sm border group">
                    <summary class="p-6 cursor-pointer font-bold text-lg text-foreground flex items-center justify-between hover:text-primary transition-colors">
                        <span><?php echo esc_html($page_question_2); ?></span>
                        <span class="text-2xl group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div class="px-6 pb-6 text-muted-foreground"><?php echo wp_kses_post($page_answer_2); ?></div>
                </details>
                <?php endif; ?>

                <?php foreach ($default_faqs as $faq): ?>
                <details class="bg-white rounded-2xl shadow-sm border group">
                    <summary class="p-6 cursor-pointer font-bold text-lg text-foreground flex items-center justify-between hover:text-primary transition-colors">
                        <span><?php echo esc_html($faq['q']); ?></span>
                        <span class="text-2xl group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div class="px-6 pb-6 text-muted-foreground"><?php echo esc_html($faq['a']); ?></div>
                </details>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

</main>

<?php get_footer(); ?>
