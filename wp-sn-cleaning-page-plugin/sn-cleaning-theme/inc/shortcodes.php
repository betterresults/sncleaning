<?php
/**
 * Shortcode System
 * Reusable content blocks that can be inserted anywhere
 * 
 * @package SN_Cleaning
 */

if (!defined('ABSPATH')) exit;

/**
 * Hero Section Shortcode
 * Usage: [sn_hero title="Custom Title" image="url"]
 */
function sn_hero_shortcode($atts) {
    $atts = shortcode_atts(array(
        'title' => '',
        'subtitle' => '',
        'image' => '',
    ), $atts);
    
    ob_start();
    ?>
    <section class="relative bg-gradient-hero text-white py-20 lg:py-32">
        <?php if ($atts['image']) : ?>
            <div class="absolute inset-0 z-0">
                <img src="<?php echo esc_url($atts['image']); ?>" 
                     alt="" 
                     class="w-full h-full object-cover opacity-30" />
            </div>
        <?php endif; ?>
        
        <div class="relative z-10 container mx-auto px-4 text-center">
            <h1 class="text-4xl lg:text-6xl font-bold mb-6">
                <?php echo esc_html($atts['title']); ?>
            </h1>
            <?php if ($atts['subtitle']) : ?>
                <p class="text-xl lg:text-2xl text-white/90">
                    <?php echo esc_html($atts['subtitle']); ?>
                </p>
            <?php endif; ?>
        </div>
    </section>
    <?php
    return ob_get_clean();
}
add_shortcode('sn_hero', 'sn_hero_shortcode');

/**
 * Stats Section Shortcode
 * Usage: [sn_stats]
 */
function sn_stats_shortcode($atts) {
    $options = get_option('sn_theme_options', array());
    
    ob_start();
    ?>
    <section class="py-16 bg-background">
        <div class="container mx-auto px-4">
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <?php for ($i = 1; $i <= 4; $i++) : 
                    $number = $options["stat_{$i}_number"] ?? '';
                    $label = $options["stat_{$i}_label"] ?? '';
                    if ($number && $label) :
                ?>
                    <div class="text-center p-6 bg-gradient-surface rounded-2xl">
                        <div class="text-3xl font-bold text-primary mb-2">
                            <?php echo esc_html($number); ?>
                        </div>
                        <div class="text-muted-foreground font-medium">
                            <?php echo esc_html($label); ?>
                        </div>
                    </div>
                <?php endif; endfor; ?>
            </div>
        </div>
    </section>
    <?php
    return ob_get_clean();
}
add_shortcode('sn_stats', 'sn_stats_shortcode');

/**
 * CTA Section Shortcode
 * Usage: [sn_cta button_text="Book Now" button_url="/booking"]
 */
function sn_cta_shortcode($atts) {
    $atts = shortcode_atts(array(
        'button_text' => 'Get Free Quote',
        'button_url' => '',
    ), $atts);
    
    if (!$atts['button_url']) {
        $atts['button_url'] = sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk');
    }
    
    ob_start();
    ?>
    <section class="py-16 bg-gradient-primary text-white">
        <div class="container mx-auto px-4 text-center">
            <h2 class="text-3xl lg:text-4xl font-bold mb-8">
                <?php _e('Ready to Get Started?', 'sn-cleaning'); ?>
            </h2>
            <a href="<?php echo esc_url($atts['button_url']); ?>" 
               class="inline-block bg-white text-primary px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-glow transform hover:scale-105 transition-all duration-300">
                <?php echo esc_html($atts['button_text']); ?>
            </a>
        </div>
    </section>
    <?php
    return ob_get_clean();
}
add_shortcode('sn_cta', 'sn_cta_shortcode');

/**
 * Service Card Shortcode
 * Usage: [sn_service_card title="End of Tenancy" icon="🏠"]
 */
function sn_service_card_shortcode($atts) {
    $atts = shortcode_atts(array(
        'title' => '',
        'description' => '',
        'icon' => '🧹',
        'link' => '',
    ), $atts);
    
    ob_start();
    ?>
    <div class="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div class="text-4xl mb-4"><?php echo esc_html($atts['icon']); ?></div>
        <h3 class="text-xl font-semibold mb-3"><?php echo esc_html($atts['title']); ?></h3>
        <?php if ($atts['description']) : ?>
            <p class="text-muted-foreground mb-4"><?php echo esc_html($atts['description']); ?></p>
        <?php endif; ?>
        <?php if ($atts['link']) : ?>
            <a href="<?php echo esc_url($atts['link']); ?>" 
               class="inline-block text-primary hover:text-primary-dark font-semibold">
                <?php _e('Learn More →', 'sn-cleaning'); ?>
            </a>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('sn_service_card', 'sn_service_card_shortcode');

/**
 * Features Section Shortcode
 * Usage: [sn_features]
 */
function sn_features_shortcode($atts) {
    $features = array(
        array('icon' => '✓', 'title' => 'Professional Team', 'description' => 'Trained and certified cleaners'),
        array('icon' => '✓', 'title' => '100% Guarantee', 'description' => 'Satisfaction guaranteed or your money back'),
        array('icon' => '✓', 'title' => 'Eco-Friendly', 'description' => 'Safe and environmentally friendly products'),
        array('icon' => '✓', 'title' => 'Flexible Scheduling', 'description' => 'Book at your convenience'),
    );
    
    ob_start();
    ?>
    <section class="py-16 bg-muted">
        <div class="container mx-auto px-4">
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <?php foreach ($features as $feature) : ?>
                    <div class="text-center">
                        <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl text-primary"><?php echo esc_html($feature['icon']); ?></span>
                        </div>
                        <h3 class="font-semibold mb-2"><?php echo esc_html($feature['title']); ?></h3>
                        <p class="text-sm text-muted-foreground"><?php echo esc_html($feature['description']); ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    <?php
    return ob_get_clean();
}
add_shortcode('sn_features', 'sn_features_shortcode');
