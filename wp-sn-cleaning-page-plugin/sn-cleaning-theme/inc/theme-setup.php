<?php
/**
 * Additional Theme Setup Functions
 * 
 * @package SN_Cleaning
 */

if (!defined('ABSPATH')) exit;

/**
 * Add custom image sizes
 */
function sn_add_image_sizes() {
    add_image_size('sn-hero', 1920, 1080, true);
    add_image_size('sn-service-card', 600, 400, true);
    add_image_size('sn-thumbnail', 400, 300, true);
}
add_action('after_setup_theme', 'sn_add_image_sizes');

/**
 * Add body classes for page templates
 */
function sn_body_classes($classes) {
    if (is_page_template('front-page.php')) {
        $classes[] = 'homepage';
    }
    if (is_page_template('page-about.php')) {
        $classes[] = 'about-page';
    }
    if (is_page_template('end-of-tenancy.php')) {
        $classes[] = 'service-page';
        $classes[] = 'end-of-tenancy-page';
    }
    return $classes;
}
add_filter('body_class', 'sn_body_classes');

/**
 * Custom excerpt length
 */
function sn_excerpt_length($length) {
    return 20;
}
add_filter('excerpt_length', 'sn_excerpt_length');

/**
 * Custom excerpt more text
 */
function sn_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'sn_excerpt_more');

/**
 * Add async/defer to scripts
 */
function sn_add_async_attribute($tag, $handle) {
    $scripts_to_async = array('sn-main-js');
    
    foreach ($scripts_to_async as $async_script) {
        if ($async_script === $handle) {
            return str_replace(' src', ' defer src', $tag);
        }
    }
    return $tag;
}
add_filter('script_loader_tag', 'sn_add_async_attribute', 10, 2);

/**
 * Remove emoji scripts
 */
function sn_disable_emojis() {
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('admin_print_scripts', 'print_emoji_detection_script');
    remove_action('wp_print_styles', 'print_emoji_styles');
    remove_action('admin_print_styles', 'print_emoji_styles');
}
add_action('init', 'sn_disable_emojis');

/**
 * Add preconnect for Google Fonts
 */
function sn_preconnect_google_fonts() {
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">';
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
}
add_action('wp_head', 'sn_preconnect_google_fonts', 1);
