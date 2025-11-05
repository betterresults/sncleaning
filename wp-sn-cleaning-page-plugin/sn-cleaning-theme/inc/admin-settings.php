<?php
/**
 * Admin Settings Page
 * Creates "SN Cleaning → Theme Settings" admin panel
 * 
 * @package SN_Cleaning
 */

if (!defined('ABSPATH')) exit;

class SN_Admin_Settings {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
    }

    public function add_admin_menu() {
        add_menu_page(
            __('SN Cleaning Settings', 'sn-cleaning'),
            __('SN Cleaning', 'sn-cleaning'),
            'manage_options',
            'sn-theme-settings',
            array($this, 'settings_page'),
            'dashicons-admin-home',
            30
        );
    }

    public function enqueue_admin_assets($hook) {
        if ($hook !== 'toplevel_page_sn-theme-settings') return;
        
        wp_enqueue_media();
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');
        
        wp_add_inline_style('wp-admin', '
            .sn-admin-tabs {
                border-bottom: 1px solid #ccc;
                margin-bottom: 30px;
            }
            .sn-admin-tabs a {
                display: inline-block;
                padding: 10px 20px;
                text-decoration: none;
                border-bottom: 2px solid transparent;
            }
            .sn-admin-tabs a.active {
                border-bottom-color: #18A5A5;
                color: #18A5A5;
                font-weight: 600;
            }
            .sn-settings-section {
                background: white;
                padding: 20px;
                margin-bottom: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .sn-settings-section h3 {
                margin-top: 0;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            .sn-field-group {
                margin-bottom: 20px;
            }
            .sn-field-group label {
                display: block;
                font-weight: 600;
                margin-bottom: 5px;
            }
            .sn-field-group input[type="text"],
            .sn-field-group textarea {
                width: 100%;
                max-width: 600px;
            }
            .sn-image-preview {
                max-width: 300px;
                margin-top: 10px;
            }
            .sn-image-preview img {
                max-width: 100%;
                height: auto;
                border: 1px solid #ddd;
            }
        ');
    }

    public function register_settings() {
        register_setting('sn_theme_options', 'sn_theme_options');
    }

    public function settings_page() {
        $active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'homepage';
        ?>
        <div class="wrap">
            <h1><?php _e('SN Cleaning Theme Settings', 'sn-cleaning'); ?></h1>
            
            <div class="sn-admin-tabs">
                <a href="?page=sn-theme-settings&tab=homepage" class="<?php echo $active_tab == 'homepage' ? 'active' : ''; ?>">
                    <?php _e('Homepage', 'sn-cleaning'); ?>
                </a>
                <a href="?page=sn-theme-settings&tab=about" class="<?php echo $active_tab == 'about' ? 'active' : ''; ?>">
                    <?php _e('About Us', 'sn-cleaning'); ?>
                </a>
                <a href="?page=sn-theme-settings&tab=service-template" class="<?php echo $active_tab == 'service-template' ? 'active' : ''; ?>">
                    <?php _e('Service Template', 'sn-cleaning'); ?>
                </a>
                <a href="?page=sn-theme-settings&tab=global" class="<?php echo $active_tab == 'global' ? 'active' : ''; ?>">
                    <?php _e('Global Settings', 'sn-cleaning'); ?>
                </a>
            </div>

            <form method="post" action="options.php">
                <?php
                settings_fields('sn_theme_options');
                
                switch($active_tab) {
                    case 'homepage':
                        $this->homepage_settings();
                        break;
                    case 'about':
                        $this->about_settings();
                        break;
                    case 'service-template':
                        $this->service_template_settings();
                        break;
                    case 'global':
                        $this->global_settings();
                        break;
                }
                
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    private function homepage_settings() {
        $options = get_option('sn_theme_options', array());
        ?>
        <div class="sn-settings-section">
            <h3><?php _e('Hero Section', 'sn-cleaning'); ?></h3>
            
            <div class="sn-field-group">
                <label><?php _e('Hero Heading', 'sn-cleaning'); ?></label>
                <input type="text" name="sn_theme_options[homepage_hero_heading]" 
                       value="<?php echo esc_attr($options['homepage_hero_heading'] ?? 'Best Cleaners In Your Area'); ?>" />
            </div>

            <div class="sn-field-group">
                <label><?php _e('Hero Subheading', 'sn-cleaning'); ?></label>
                <textarea name="sn_theme_options[homepage_hero_subheading]" rows="3"><?php echo esc_textarea($options['homepage_hero_subheading'] ?? 'Professional cleaning services you can trust'); ?></textarea>
            </div>

            <div class="sn-field-group">
                <label><?php _e('Hero Background Image', 'sn-cleaning'); ?></label>
                <input type="text" name="sn_theme_options[homepage_hero_image]" 
                       value="<?php echo esc_url($options['homepage_hero_image'] ?? ''); ?>" 
                       class="sn-image-url" />
                <button type="button" class="button sn-upload-image"><?php _e('Upload Image', 'sn-cleaning'); ?></button>
                <div class="sn-image-preview">
                    <?php if (!empty($options['homepage_hero_image'])) : ?>
                        <img src="<?php echo esc_url($options['homepage_hero_image']); ?>" />
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <div class="sn-settings-section">
            <h3><?php _e('Statistics', 'sn-cleaning'); ?></h3>
            
            <?php for ($i = 1; $i <= 4; $i++) : ?>
                <div class="sn-field-group">
                    <h4><?php printf(__('Stat %d', 'sn-cleaning'), $i); ?></h4>
                    <label><?php _e('Number', 'sn-cleaning'); ?></label>
                    <input type="text" name="sn_theme_options[stat_<?php echo $i; ?>_number]" 
                           value="<?php echo esc_attr($options["stat_{$i}_number"] ?? ''); ?>" />
                    
                    <label><?php _e('Label', 'sn-cleaning'); ?></label>
                    <input type="text" name="sn_theme_options[stat_<?php echo $i; ?>_label]" 
                           value="<?php echo esc_attr($options["stat_{$i}_label"] ?? ''); ?>" />
                </div>
            <?php endfor; ?>
        </div>

        <div class="sn-settings-section">
            <h3><?php _e('Services Section', 'sn-cleaning'); ?></h3>
            
            <?php for ($i = 1; $i <= 10; $i++) : ?>
                <div class="sn-field-group">
                    <h4><?php printf(__('Service %d', 'sn-cleaning'), $i); ?></h4>
                    <label><?php _e('Title', 'sn-cleaning'); ?></label>
                    <input type="text" name="sn_theme_options[service_<?php echo $i; ?>_title]" 
                           value="<?php echo esc_attr($options["service_{$i}_title"] ?? ''); ?>" />
                    
                    <label><?php _e('Description', 'sn-cleaning'); ?></label>
                    <textarea name="sn_theme_options[service_<?php echo $i; ?>_description]" rows="2"><?php echo esc_textarea($options["service_{$i}_description"] ?? ''); ?></textarea>
                    
                    <label><?php _e('Link URL', 'sn-cleaning'); ?></label>
                    <input type="text" name="sn_theme_options[service_<?php echo $i; ?>_link]" 
                           value="<?php echo esc_url($options["service_{$i}_link"] ?? ''); ?>" />
                </div>
            <?php endfor; ?>
        </div>
        <?php
    }

    private function about_settings() {
        $options = get_option('sn_theme_options', array());
        ?>
        <div class="sn-settings-section">
            <h3><?php _e('About Hero Section', 'sn-cleaning'); ?></h3>
            
            <div class="sn-field-group">
                <label><?php _e('Hero Heading', 'sn-cleaning'); ?></label>
                <input type="text" name="sn_theme_options[about_hero_heading]" 
                       value="<?php echo esc_attr($options['about_hero_heading'] ?? 'About SN Cleaning Services'); ?>" />
            </div>

            <div class="sn-field-group">
                <label><?php _e('Hero Subheading', 'sn-cleaning'); ?></label>
                <textarea name="sn_theme_options[about_hero_subheading]" rows="3"><?php echo esc_textarea($options['about_hero_subheading'] ?? ''); ?></textarea>
            </div>
        </div>

        <div class="sn-settings-section">
            <h3><?php _e('Who We Are', 'sn-cleaning'); ?></h3>
            
            <div class="sn-field-group">
                <label><?php _e('Main Content', 'sn-cleaning'); ?></label>
                <textarea name="sn_theme_options[about_main_content]" rows="10"><?php echo esc_textarea($options['about_main_content'] ?? ''); ?></textarea>
            </div>
        </div>

        <div class="sn-settings-section">
            <h3><?php _e('Training & Certifications', 'sn-cleaning'); ?></h3>
            
            <?php for ($i = 1; $i <= 4; $i++) : ?>
                <div class="sn-field-group">
                    <h4><?php printf(__('Training Point %d', 'sn-cleaning'), $i); ?></h4>
                    <label><?php _e('Title', 'sn-cleaning'); ?></label>
                    <input type="text" name="sn_theme_options[training_<?php echo $i; ?>_title]" 
                           value="<?php echo esc_attr($options["training_{$i}_title"] ?? ''); ?>" />
                    
                    <label><?php _e('Description', 'sn-cleaning'); ?></label>
                    <textarea name="sn_theme_options[training_<?php echo $i; ?>_description]" rows="2"><?php echo esc_textarea($options["training_{$i}_description"] ?? ''); ?></textarea>
                </div>
            <?php endfor; ?>
        </div>
        <?php
    }

    private function service_template_settings() {
        $options = get_option('sn_theme_options', array());
        ?>
        <div class="sn-settings-section">
            <h3><?php _e('End of Tenancy Template Settings', 'sn-cleaning'); ?></h3>
            <p><?php _e('These settings will be used for pages assigned the "End of Tenancy" template.', 'sn-cleaning'); ?></p>
            
            <div class="sn-field-group">
                <label><?php _e('Default Hero Heading', 'sn-cleaning'); ?></label>
                <input type="text" name="sn_theme_options[eot_hero_heading]" 
                       value="<?php echo esc_attr($options['eot_hero_heading'] ?? 'End of Tenancy Cleaning'); ?>" />
            </div>

            <div class="sn-field-group">
                <label><?php _e('Default Subheading', 'sn-cleaning'); ?></label>
                <textarea name="sn_theme_options[eot_hero_subheading]" rows="3"><?php echo esc_textarea($options['eot_hero_subheading'] ?? ''); ?></textarea>
            </div>
        </div>
        <?php
    }

    private function global_settings() {
        $options = get_option('sn_theme_options', array());
        ?>
        <div class="sn-settings-section">
            <h3><?php _e('Contact Information', 'sn-cleaning'); ?></h3>
            
            <div class="sn-field-group">
                <label><?php _e('Phone Number', 'sn-cleaning'); ?></label>
                <input type="text" name="sn_theme_options[contact_phone]" 
                       value="<?php echo esc_attr($options['contact_phone'] ?? '020 3835 5033'); ?>" />
            </div>

            <div class="sn-field-group">
                <label><?php _e('WhatsApp Number (without +)', 'sn-cleaning'); ?></label>
                <input type="text" name="sn_theme_options[contact_whatsapp]" 
                       value="<?php echo esc_attr($options['contact_whatsapp'] ?? '442038355033'); ?>" />
            </div>

            <div class="sn-field-group">
                <label><?php _e('Email Address', 'sn-cleaning'); ?></label>
                <input type="email" name="sn_theme_options[contact_email]" 
                       value="<?php echo esc_attr($options['contact_email'] ?? 'info@sncleaningservices.co.uk'); ?>" />
            </div>

            <div class="sn-field-group">
                <label><?php _e('Service Area', 'sn-cleaning'); ?></label>
                <input type="text" name="sn_theme_options[service_area]" 
                       value="<?php echo esc_attr($options['service_area'] ?? 'London & Essex'); ?>" />
            </div>

            <div class="sn-field-group">
                <label><?php _e('Company Number', 'sn-cleaning'); ?></label>
                <input type="text" name="sn_theme_options[company_number]" 
                       value="<?php echo esc_attr($options['company_number'] ?? '15912581'); ?>" />
            </div>

            <div class="sn-field-group">
                <label><?php _e('Booking URL', 'sn-cleaning'); ?></label>
                <input type="url" name="sn_theme_options[booking_url]" 
                       value="<?php echo esc_url($options['booking_url'] ?? 'https://book.sncleaningservices.co.uk'); ?>" />
            </div>

            <div class="sn-field-group">
                <label><?php _e('Footer Description', 'sn-cleaning'); ?></label>
                <textarea name="sn_theme_options[footer_description]" rows="3"><?php echo esc_textarea($options['footer_description'] ?? 'Professional cleaning services across London and Essex.'); ?></textarea>
            </div>
        </div>
        <?php
    }
}

new SN_Admin_Settings();

// Media uploader JavaScript
add_action('admin_footer', 'sn_admin_media_uploader_js');
function sn_admin_media_uploader_js() {
    if (!isset($_GET['page']) || $_GET['page'] !== 'sn-theme-settings') return;
    ?>
    <script>
    jQuery(document).ready(function($) {
        $('.sn-upload-image').on('click', function(e) {
            e.preventDefault();
            var button = $(this);
            var input = button.prev('.sn-image-url');
            var preview = button.next('.sn-image-preview');
            
            var mediaUploader = wp.media({
                title: 'Choose Image',
                button: { text: 'Use this image' },
                multiple: false
            });
            
            mediaUploader.on('select', function() {
                var attachment = mediaUploader.state().get('selection').first().toJSON();
                input.val(attachment.url);
                preview.html('<img src="' + attachment.url + '" />');
            });
            
            mediaUploader.open();
        });
    });
    </script>
    <?php
}
