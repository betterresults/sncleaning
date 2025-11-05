<?php
/**
 * SN Cleaning Theme Functions
 * 
 * @package SN_Cleaning
 * @since 1.0.0
 */

if (!defined('ABSPATH')) exit;

// Theme constants
define('SN_THEME_VERSION', '1.0.0');
define('SN_THEME_PATH', get_template_directory());
define('SN_THEME_URL', get_template_directory_uri());

/**
 * Theme Setup
 */
function sn_theme_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script'
    ));
    add_theme_support('custom-logo', array(
        'height'      => 100,
        'width'       => 400,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    add_theme_support('responsive-embeds');
    add_theme_support('align-wide');

    // Register navigation menus
    register_nav_menus(array(
        'primary'  => __('Primary Menu', 'sn-cleaning'),
        'services' => __('Services Menu', 'sn-cleaning'),
        'footer'   => __('Footer Menu', 'sn-cleaning'),
    ));
}
add_action('after_setup_theme', 'sn_theme_setup');

/**
 * Enqueue scripts and styles
 */
function sn_enqueue_assets() {
    // Load Tailwind via CDN to enable utility classes used in templates
    wp_enqueue_script('tailwind-cdn', 'https://cdn.tailwindcss.com', array(), null, false);

    // Base design system and utilities (pure CSS, no build step)
    wp_enqueue_style('sn-esn-styles', SN_THEME_URL . '/assets/css/esn-style.css', array(), SN_THEME_VERSION);

    // Optional: theme enhancements (may contain unprocessed @tailwind rules; kept last to allow overrides)
    if (file_exists(SN_THEME_PATH . '/assets/css/main.css')) {
        wp_enqueue_style('sn-main-styles', SN_THEME_URL . '/assets/css/main.css', array('sn-esn-styles'), SN_THEME_VERSION);
    }
    
    // Main JavaScript
    wp_enqueue_script('sn-main-js', SN_THEME_URL . '/assets/js/main.js', array(), SN_THEME_VERSION, true);
    
    // Localize script for AJAX
    wp_localize_script('sn-main-js', 'snTheme', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('sn_theme_nonce'),
    ));
}
add_action('wp_enqueue_scripts', 'sn_enqueue_assets');

/**
 * Include required files
 */
require_once SN_THEME_PATH . '/inc/theme-setup.php';
require_once SN_THEME_PATH . '/inc/customizer.php';
require_once SN_THEME_PATH . '/inc/widgets.php';
require_once SN_THEME_PATH . '/inc/admin-settings.php';
require_once SN_THEME_PATH . '/inc/shortcodes.php';
require_once SN_THEME_PATH . '/inc/meta-boxes.php';

/**
 * Register widget areas
 */
function sn_widgets_init() {
    register_sidebar(array(
        'name'          => __('Sidebar', 'sn-cleaning'),
        'id'            => 'sidebar-1',
        'description'   => __('Add widgets here to appear in your sidebar.', 'sn-cleaning'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ));

    // Footer widget areas (4 columns)
    for ($i = 1; $i <= 4; $i++) {
        register_sidebar(array(
            'name'          => sprintf(__('Footer Column %d', 'sn-cleaning'), $i),
            'id'            => 'footer-' . $i,
            'description'   => sprintf(__('Footer column %d widget area', 'sn-cleaning'), $i),
            'before_widget' => '<div class="footer-widget mb-6">',
            'after_widget'  => '</div>',
            'before_title'  => '<h3 class="text-lg font-semibold mb-4">',
            'after_title'   => '</h3>',
        ));
    }
}
add_action('widgets_init', 'sn_widgets_init');

/**
 * Get theme option with default fallback
 */
function sn_get_option($option_name, $default = '') {
    $options = get_option('sn_theme_options', array());
    return isset($options[$option_name]) ? $options[$option_name] : $default;
}

/**
 * Add admin menu CSS classes
 */
function sn_admin_menu_styles() {
    echo '<style>
        #adminmenu .toplevel_page_sn-theme-settings .wp-menu-image:before {
            content: "\f111";
        }
    </style>';
}
add_action('admin_head', 'sn_admin_menu_styles');
