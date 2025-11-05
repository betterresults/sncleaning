<?php
/**
 * 404 Error Page Template
 * 
 * @package SN_Cleaning
 */

get_header(); ?>

<main id="main-content" class="min-h-screen bg-background flex items-center justify-center py-20">
    <div class="container mx-auto px-4">
        <div class="max-w-2xl mx-auto text-center space-y-8">
            <div class="text-9xl font-bold text-primary/20">404</div>
            <h1 class="text-4xl lg:text-5xl font-bold text-foreground">
                <?php _e('Page Not Found', 'sn-cleaning'); ?>
            </h1>
            <p class="text-xl text-muted-foreground">
                <?php _e('Sorry, the page you\'re looking for doesn\'t exist or has been moved.', 'sn-cleaning'); ?>
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <a href="<?php echo esc_url(home_url('/')); ?>" 
                   class="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <?php _e('Go to Homepage', 'sn-cleaning'); ?>
                </a>
                <a href="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" 
                   class="bg-muted text-foreground px-8 py-4 rounded-2xl font-semibold hover:bg-muted/80 transition-all duration-300">
                    <?php _e('Get a Quote', 'sn-cleaning'); ?>
                </a>
            </div>

            <div class="pt-12">
                <h2 class="text-2xl font-semibold text-foreground mb-6">
                    <?php _e('Popular Pages', 'sn-cleaning'); ?>
                </h2>
                <div class="grid sm:grid-cols-2 gap-4">
                    <a href="<?php echo esc_url(home_url('/services/end-of-tenancy')); ?>" 
                       class="p-4 bg-gradient-surface rounded-lg hover:shadow-md transition-all text-left">
                        <h3 class="font-semibold text-foreground mb-1">End of Tenancy Cleaning</h3>
                        <p class="text-sm text-muted-foreground">99.8% deposit return rate</p>
                    </a>
                    <a href="<?php echo esc_url(home_url('/services/domestic')); ?>" 
                       class="p-4 bg-gradient-surface rounded-lg hover:shadow-md transition-all text-left">
                        <h3 class="font-semibold text-foreground mb-1">Domestic Cleaning</h3>
                        <p class="text-sm text-muted-foreground">Regular & one-off services</p>
                    </a>
                    <a href="<?php echo esc_url(home_url('/about')); ?>" 
                       class="p-4 bg-gradient-surface rounded-lg hover:shadow-md transition-all text-left">
                        <h3 class="font-semibold text-foreground mb-1">About Us</h3>
                        <p class="text-sm text-muted-foreground">Meet our professional team</p>
                    </a>
                    <a href="<?php echo esc_url(home_url('/contact')); ?>" 
                       class="p-4 bg-gradient-surface rounded-lg hover:shadow-md transition-all text-left">
                        <h3 class="font-semibold text-foreground mb-1">Contact Us</h3>
                        <p class="text-sm text-muted-foreground">Get in touch today</p>
                    </a>
                </div>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>
