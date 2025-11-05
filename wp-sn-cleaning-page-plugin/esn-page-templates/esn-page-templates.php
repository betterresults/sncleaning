<?php
/**
 * Plugin Name: ESN Page Templates
 * Plugin URI: https://example.com
 * Description: Custom page templates with dynamic content fields for service pages
 * Version: 1.6.0
 * Author: ESN Templates
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('ESN_TEMPLATES_VERSION', '1.8.0');
define('ESN_TEMPLATES_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ESN_TEMPLATES_PLUGIN_PATH', plugin_dir_path(__FILE__));

// Include required files
require_once ESN_TEMPLATES_PLUGIN_PATH . 'inc/meta-boxes.php';
require_once ESN_TEMPLATES_PLUGIN_PATH . 'inc/template-functions.php';
require_once ESN_TEMPLATES_PLUGIN_PATH . 'inc/template-loader.php';
require_once ESN_TEMPLATES_PLUGIN_PATH . 'inc/admin-dashboard.php';
require_once ESN_TEMPLATES_PLUGIN_PATH . 'inc/theme-functions.php';
require_once ESN_TEMPLATES_PLUGIN_PATH . 'inc/static-content-editor.php';

class ESN_Page_Templates {

    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }

    public function init() {
        // Initialize plugin components
        new ESN_Meta_Boxes();
        new ESN_Template_Loader();
        new ESN_Admin_Dashboard();
        new ESN_Static_Content_Editor();
    }

    public function enqueue_scripts() {
        wp_enqueue_style(
            'esn-templates-style',
            ESN_TEMPLATES_PLUGIN_URL . 'assets/style.css',
            array(),
            ESN_TEMPLATES_VERSION
        );
        
        wp_enqueue_script(
            'esn-templates-script',
            ESN_TEMPLATES_PLUGIN_URL . 'assets/script.js',
            array('jquery'),
            ESN_TEMPLATES_VERSION,
            true
        );
    }

    public function activate() {
        // Activation code here
        flush_rewrite_rules();
    }

    public function deactivate() {
        // Deactivation code here
        flush_rewrite_rules();
    }
}

// Initialize the plugin
new ESN_Page_Templates();