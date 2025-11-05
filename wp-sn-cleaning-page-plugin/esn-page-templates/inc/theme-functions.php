<?php
/**
 * Theme Functions for ESN Page Templates
 * Handles header and footer integration
 */

class ESN_Theme_Functions {

    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('after_setup_theme', array($this, 'setup_theme_support'));
        add_filter('get_header', array($this, 'load_custom_header'));
        add_filter('get_footer', array($this, 'load_custom_footer'));
    }

    public function init() {
        // Register navigation menus
        register_nav_menus(array(
            'primary' => 'Primary Navigation',
            'footer' => 'Footer Navigation'
        ));
    }

    public function setup_theme_support() {
        // Add theme support for custom logo
        add_theme_support('custom-logo', array(
            'height' => 100,
            'width' => 400,
            'flex-height' => true,
            'flex-width' => true,
        ));

        // Add theme support for post thumbnails
        add_theme_support('post-thumbnails');

        // Add theme support for HTML5
        add_theme_support('html5', array(
            'search-form',
            'comment-form',
            'comment-list',
            'gallery',
            'caption',
        ));
    }

    /**
     * Load custom header for ESN templates
     */
    public function load_custom_header($name) {
        global $post;
        
        // Check if we're on a page using ESN templates
        if (is_page() && $post) {
            $page_template = get_page_template_slug($post->ID);
            
            if ($page_template === 'homepage-template.php' || $page_template === 'service-cleaning-template.php') {
                $header_path = ESN_TEMPLATES_PLUGIN_PATH . 'templates/header-esn.php';
                
                if (file_exists($header_path)) {
                    include $header_path;
                    return;
                }
            }
        }
        
        // Check if ESN header should be used site-wide
        $use_esn_header = get_option('esn_use_custom_header', false);
        if ($use_esn_header) {
            $header_path = ESN_TEMPLATES_PLUGIN_PATH . 'templates/header-esn.php';
            
            if (file_exists($header_path)) {
                include $header_path;
                return;
            }
        }
    }

    /**
     * Load custom footer for ESN templates
     */
    public function load_custom_footer($name) {
        global $post;
        
        // Check if we're on a page using ESN templates
        if (is_page() && $post) {
            $page_template = get_page_template_slug($post->ID);
            
            if ($page_template === 'homepage-template.php' || $page_template === 'service-cleaning-template.php') {
                $footer_path = ESN_TEMPLATES_PLUGIN_PATH . 'templates/footer-esn.php';
                
                if (file_exists($footer_path)) {
                    include $footer_path;
                    return;
                }
            }
        }
        
        // Check if ESN footer should be used site-wide
        $use_esn_footer = get_option('esn_use_custom_footer', false);
        if ($use_esn_footer) {
            $footer_path = ESN_TEMPLATES_PLUGIN_PATH . 'templates/footer-esn.php';
            
            if (file_exists($footer_path)) {
                include $footer_path;
                return;
            }
        }
    }
}

// Initialize theme functions
new ESN_Theme_Functions();