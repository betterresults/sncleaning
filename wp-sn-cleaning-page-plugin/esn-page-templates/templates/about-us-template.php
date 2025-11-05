<?php
/**
 * Template Name: About Us Template
 * Description: Static template for About Us page with editable content
 */

get_header('esn');
?>

<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo get_option('esn_aboutus_hero_heading', 'About SN Cleaning Services'); ?> | <?php bloginfo('name'); ?></title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<?php include(ESN_TEMPLATES_PLUGIN_PATH . 'templates/header-esn.php'); ?>

<!-- Hero Section -->
<section class="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary/80 text-white">
    <div class="absolute inset-0 bg-[url('/hero-kitchen.jpg')] bg-cover bg-center opacity-10"></div>
    
    <div class="relative z-10 container mx-auto px-4 py-20 text-center">
        <h1 class="text-5xl lg:text-7xl font-bold mb-6 animate-fade-in">
            <?php echo esc_html(get_option('esn_aboutus_hero_heading', 'About SN Cleaning Services')); ?>
        </h1>
        <p class="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
            <?php echo esc_html(get_option('esn_aboutus_hero_subheading', 'Your Trusted Partner in Professional Cleaning Since 2015')); ?>
        </p>
    </div>
</section>

<!-- Stats Section -->
<section class="py-16 bg-background">
    <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div class="text-center p-6 bg-gradient-surface rounded-2xl">
                <div class="text-4xl font-bold text-primary mb-2">
                    <?php echo esc_html(get_option('esn_aboutus_stat1_number', '8,000+')); ?>
                </div>
                <div class="text-muted-foreground font-medium">
                    <?php echo esc_html(get_option('esn_aboutus_stat1_label', 'Happy Customers')); ?>
                </div>
            </div>
            
            <div class="text-center p-6 bg-gradient-surface rounded-2xl">
                <div class="text-4xl font-bold text-primary mb-2">
                    <?php echo esc_html(get_option('esn_aboutus_stat2_number', '99.8%')); ?>
                </div>
                <div class="text-muted-foreground font-medium">
                    <?php echo esc_html(get_option('esn_aboutus_stat2_label', 'Success Rate')); ?>
                </div>
            </div>
            
            <div class="text-center p-6 bg-gradient-surface rounded-2xl">
                <div class="text-4xl font-bold text-primary mb-2">
                    <?php echo esc_html(get_option('esn_aboutus_stat3_number', '50,000+')); ?>
                </div>
                <div class="text-muted-foreground font-medium">
                    <?php echo esc_html(get_option('esn_aboutus_stat3_label', 'Hours Worked')); ?>
                </div>
            </div>
            
            <div class="text-center p-6 bg-gradient-surface rounded-2xl">
                <div class="text-4xl font-bold text-primary mb-2">
                    <?php echo esc_html(get_option('esn_aboutus_stat4_number', '49')); ?>
                </div>
                <div class="text-muted-foreground font-medium">
                    <?php echo esc_html(get_option('esn_aboutus_stat4_label', 'Expert Cleaners')); ?>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Who We Are Section -->
<section class="py-20 bg-gradient-surface">
    <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center space-y-8">
            <h2 class="text-4xl lg:text-5xl font-bold text-foreground">
                <?php echo esc_html(get_option('esn_aboutus_about_heading', 'Who We Are')); ?>
            </h2>
            
            <div class="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p><?php echo esc_html(get_option('esn_aboutus_about_paragraph1', 'SN Cleaning Services was founded with a simple mission: to provide the highest quality cleaning services across London and Essex. What started as a small team has grown into a trusted name in both residential and commercial cleaning, serving over 8,000 satisfied customers.')); ?></p>
                
                <p><?php echo esc_html(get_option('esn_aboutus_about_paragraph2', 'We understand that your time is precious and your spaces deserve the best care. That\'s why we\'ve assembled a team of 49 expert cleaners who are not just trained professionals, but passionate individuals dedicated to making your home or office spotless.')); ?></p>
            </div>
        </div>
    </div>
</section>

<!-- Training Section -->
<section class="py-20 bg-background">
    <div class="container mx-auto px-4">
        <div class="max-w-5xl mx-auto">
            <div class="text-center mb-12">
                <h2 class="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                    <?php echo esc_html(get_option('esn_aboutus_training_heading', 'Professional Training & Standards')); ?>
                </h2>
                <p class="text-xl text-muted-foreground">
                    <?php echo esc_html(get_option('esn_aboutus_training_description', 'Every member of our team undergoes rigorous training to ensure the highest standards of service.')); ?>
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="p-6 bg-gradient-surface rounded-xl">
                    <h3 class="text-xl font-bold text-foreground mb-2">Comprehensive Onboarding</h3>
                    <p class="text-muted-foreground">Intensive training program covering all cleaning techniques and safety protocols.</p>
                </div>
                
                <div class="p-6 bg-gradient-surface rounded-xl">
                    <h3 class="text-xl font-bold text-foreground mb-2">Equipment Mastery</h3>
                    <p class="text-muted-foreground">Hands-on training with professional-grade cleaning equipment and eco-friendly products.</p>
                </div>
                
                <div class="p-6 bg-gradient-surface rounded-xl">
                    <h3 class="text-xl font-bold text-foreground mb-2">Quality Assurance</h3>
                    <p class="text-muted-foreground">Regular performance reviews and customer feedback integration.</p>
                </div>
                
                <div class="p-6 bg-gradient-surface rounded-xl">
                    <h3 class="text-xl font-bold text-foreground mb-2">Safety First</h3>
                    <p class="text-muted-foreground">Health and safety certification for all team members.</p>
                </div>
                
                <div class="p-6 bg-gradient-surface rounded-xl">
                    <h3 class="text-xl font-bold text-foreground mb-2">Customer Service</h3>
                    <p class="text-muted-foreground">Excellence in communication and professionalism training.</p>
                </div>
                
                <div class="p-6 bg-gradient-surface rounded-xl">
                    <h3 class="text-xl font-bold text-foreground mb-2">Continuous Development</h3>
                    <p class="text-muted-foreground">Ongoing training sessions on latest cleaning innovations.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Call to Action Section -->
<section class="py-20 bg-gradient-to-br from-primary via-primary-dark to-primary/80 text-white">
    <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto text-center space-y-8">
            <h2 class="text-4xl lg:text-5xl font-bold">
                <?php echo esc_html(get_option('esn_aboutus_cta_heading', 'Ready to See the Difference?')); ?>
            </h2>
            <p class="text-xl text-white/90 leading-relaxed">
                <?php echo esc_html(get_option('esn_aboutus_cta_description', 'Join over 8,000 satisfied customers across London. Get your free quote today.')); ?>
            </p>
            <a href="/contact" class="inline-block bg-white text-primary hover:bg-white/90 text-lg px-12 py-6 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
                Get Instant Quote
            </a>
        </div>
    </div>
</section>

<?php include(ESN_TEMPLATES_PLUGIN_PATH . 'templates/footer-esn.php'); ?>

<?php wp_footer(); ?>
</body>
</html>
