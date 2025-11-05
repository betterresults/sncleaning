<?php
/**
 * Static Content Editor for Homepage and About Us Templates
 */

if (!defined('ABSPATH')) {
    exit;
}

class ESN_Static_Content_Editor {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_menu_page'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    public function add_menu_page() {
        add_submenu_page(
            'esn-templates-dashboard',
            'Edit Static Pages',
            'Edit Static Pages',
            'manage_options',
            'esn-static-editor',
            array($this, 'render_editor_page')
        );
    }
    
    public function register_settings() {
        // Homepage Settings
        register_setting('esn_homepage_content', 'esn_homepage_hero_heading');
        register_setting('esn_homepage_content', 'esn_homepage_hero_subheading');
        register_setting('esn_homepage_content', 'esn_homepage_hero_description');
        
        // About Us Settings
        register_setting('esn_aboutus_content', 'esn_aboutus_hero_heading');
        register_setting('esn_aboutus_content', 'esn_aboutus_hero_subheading');
        register_setting('esn_aboutus_content', 'esn_aboutus_stat1_number');
        register_setting('esn_aboutus_content', 'esn_aboutus_stat1_label');
        register_setting('esn_aboutus_content', 'esn_aboutus_stat2_number');
        register_setting('esn_aboutus_content', 'esn_aboutus_stat2_label');
        register_setting('esn_aboutus_content', 'esn_aboutus_stat3_number');
        register_setting('esn_aboutus_content', 'esn_aboutus_stat3_label');
        register_setting('esn_aboutus_content', 'esn_aboutus_stat4_number');
        register_setting('esn_aboutus_content', 'esn_aboutus_stat4_label');
        register_setting('esn_aboutus_content', 'esn_aboutus_about_heading');
        register_setting('esn_aboutus_content', 'esn_aboutus_about_paragraph1');
        register_setting('esn_aboutus_content', 'esn_aboutus_about_paragraph2');
        register_setting('esn_aboutus_content', 'esn_aboutus_training_heading');
        register_setting('esn_aboutus_content', 'esn_aboutus_training_description');
        register_setting('esn_aboutus_content', 'esn_aboutus_cta_heading');
        register_setting('esn_aboutus_content', 'esn_aboutus_cta_description');
    }
    
    public function render_editor_page() {
        $active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'homepage';
        
        if (isset($_POST['submit'])) {
            if ($active_tab === 'homepage') {
                $this->save_homepage_content();
            } else {
                $this->save_aboutus_content();
            }
            echo '<div class="notice notice-success"><p>Content saved successfully!</p></div>';
        }
        
        ?>
        <div class="wrap">
            <h1>Edit Static Pages Content</h1>
            <p>Edit content for your static Homepage and About Us templates.</p>
            
            <h2 class="nav-tab-wrapper">
                <a href="?page=esn-static-editor&tab=homepage" class="nav-tab <?php echo $active_tab == 'homepage' ? 'nav-tab-active' : ''; ?>">
                    Homepage
                </a>
                <a href="?page=esn-static-editor&tab=aboutus" class="nav-tab <?php echo $active_tab == 'aboutus' ? 'nav-tab-active' : ''; ?>">
                    About Us
                </a>
            </h2>
            
            <form method="post" action="">
                <?php
                if ($active_tab === 'homepage') {
                    $this->render_homepage_fields();
                } else {
                    $this->render_aboutus_fields();
                }
                ?>
                <p class="submit">
                    <input type="submit" name="submit" class="button button-primary" value="Save Changes">
                </p>
            </form>
        </div>
        <?php
    }
    
    private function render_homepage_fields() {
        ?>
        <table class="form-table">
            <tr>
                <th colspan="2"><h2>Hero Section</h2></th>
            </tr>
            <tr>
                <th scope="row">Main Heading</th>
                <td>
                    <input type="text" name="esn_homepage_hero_heading" value="<?php echo esc_attr(get_option('esn_homepage_hero_heading', 'Professional Cleaning Services in London')); ?>" class="large-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Subheading</th>
                <td>
                    <input type="text" name="esn_homepage_hero_subheading" value="<?php echo esc_attr(get_option('esn_homepage_hero_subheading', 'Trusted by Over 8,000 Happy Customers')); ?>" class="large-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Description</th>
                <td>
                    <textarea name="esn_homepage_hero_description" rows="3" class="large-text"><?php echo esc_textarea(get_option('esn_homepage_hero_description', 'From domestic cleaning to end of tenancy, we deliver exceptional results every time.')); ?></textarea>
                </td>
            </tr>
        </table>
        <?php
    }
    
    private function render_aboutus_fields() {
        ?>
        <table class="form-table">
            <tr>
                <th colspan="2"><h2>Hero Section</h2></th>
            </tr>
            <tr>
                <th scope="row">Main Heading</th>
                <td>
                    <input type="text" name="esn_aboutus_hero_heading" value="<?php echo esc_attr(get_option('esn_aboutus_hero_heading', 'About SN Cleaning Services')); ?>" class="large-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Subheading</th>
                <td>
                    <input type="text" name="esn_aboutus_hero_subheading" value="<?php echo esc_attr(get_option('esn_aboutus_hero_subheading', 'Your Trusted Partner in Professional Cleaning Since 2015')); ?>" class="large-text">
                </td>
            </tr>
            
            <tr>
                <th colspan="2"><h2>Company Statistics</h2></th>
            </tr>
            <tr>
                <th scope="row">Stat 1 - Number</th>
                <td>
                    <input type="text" name="esn_aboutus_stat1_number" value="<?php echo esc_attr(get_option('esn_aboutus_stat1_number', '8,000+')); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Stat 1 - Label</th>
                <td>
                    <input type="text" name="esn_aboutus_stat1_label" value="<?php echo esc_attr(get_option('esn_aboutus_stat1_label', 'Happy Customers')); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Stat 2 - Number</th>
                <td>
                    <input type="text" name="esn_aboutus_stat2_number" value="<?php echo esc_attr(get_option('esn_aboutus_stat2_number', '99.8%')); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Stat 2 - Label</th>
                <td>
                    <input type="text" name="esn_aboutus_stat2_label" value="<?php echo esc_attr(get_option('esn_aboutus_stat2_label', 'Success Rate')); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Stat 3 - Number</th>
                <td>
                    <input type="text" name="esn_aboutus_stat3_number" value="<?php echo esc_attr(get_option('esn_aboutus_stat3_number', '50,000+')); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Stat 3 - Label</th>
                <td>
                    <input type="text" name="esn_aboutus_stat3_label" value="<?php echo esc_attr(get_option('esn_aboutus_stat3_label', 'Hours Worked')); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Stat 4 - Number</th>
                <td>
                    <input type="text" name="esn_aboutus_stat4_number" value="<?php echo esc_attr(get_option('esn_aboutus_stat4_number', '49')); ?>" class="regular-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Stat 4 - Label</th>
                <td>
                    <input type="text" name="esn_aboutus_stat4_label" value="<?php echo esc_attr(get_option('esn_aboutus_stat4_label', 'Expert Cleaners')); ?>" class="regular-text">
                </td>
            </tr>
            
            <tr>
                <th colspan="2"><h2>About Section - "Who We Are"</h2></th>
            </tr>
            <tr>
                <th scope="row">Section Heading</th>
                <td>
                    <input type="text" name="esn_aboutus_about_heading" value="<?php echo esc_attr(get_option('esn_aboutus_about_heading', 'Who We Are')); ?>" class="large-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Paragraph 1</th>
                <td>
                    <textarea name="esn_aboutus_about_paragraph1" rows="4" class="large-text"><?php echo esc_textarea(get_option('esn_aboutus_about_paragraph1', 'SN Cleaning Services was founded with a simple mission: to provide the highest quality cleaning services across London and Essex. What started as a small team has grown into a trusted name in both residential and commercial cleaning, serving over 8,000 satisfied customers.')); ?></textarea>
                </td>
            </tr>
            <tr>
                <th scope="row">Paragraph 2</th>
                <td>
                    <textarea name="esn_aboutus_about_paragraph2" rows="4" class="large-text"><?php echo esc_textarea(get_option('esn_aboutus_about_paragraph2', 'We understand that your time is precious and your spaces deserve the best care. That\'s why we\'ve assembled a team of 49 expert cleaners who are not just trained professionals, but passionate individuals dedicated to making your home or office spotless.')); ?></textarea>
                </td>
            </tr>
            
            <tr>
                <th colspan="2"><h2>Training Section</h2></th>
            </tr>
            <tr>
                <th scope="row">Training Heading</th>
                <td>
                    <input type="text" name="esn_aboutus_training_heading" value="<?php echo esc_attr(get_option('esn_aboutus_training_heading', 'Professional Training & Standards')); ?>" class="large-text">
                </td>
            </tr>
            <tr>
                <th scope="row">Training Description</th>
                <td>
                    <textarea name="esn_aboutus_training_description" rows="3" class="large-text"><?php echo esc_textarea(get_option('esn_aboutus_training_description', 'Every member of our team undergoes rigorous training to ensure the highest standards of service.')); ?></textarea>
                </td>
            </tr>
            
            <tr>
                <th colspan="2"><h2>Call to Action Section</h2></th>
            </tr>
            <tr>
                <th scope="row">CTA Heading</th>
                <td>
                    <input type="text" name="esn_aboutus_cta_heading" value="<?php echo esc_attr(get_option('esn_aboutus_cta_heading', 'Ready to See the Difference?')); ?>" class="large-text">
                </td>
            </tr>
            <tr>
                <th scope="row">CTA Description</th>
                <td>
                    <textarea name="esn_aboutus_cta_description" rows="2" class="large-text"><?php echo esc_textarea(get_option('esn_aboutus_cta_description', 'Join over 8,000 satisfied customers across London. Get your free quote today.')); ?></textarea>
                </td>
            </tr>
        </table>
        <?php
    }
    
    private function save_homepage_content() {
        if (isset($_POST['esn_homepage_hero_heading'])) {
            update_option('esn_homepage_hero_heading', sanitize_text_field($_POST['esn_homepage_hero_heading']));
        }
        if (isset($_POST['esn_homepage_hero_subheading'])) {
            update_option('esn_homepage_hero_subheading', sanitize_text_field($_POST['esn_homepage_hero_subheading']));
        }
        if (isset($_POST['esn_homepage_hero_description'])) {
            update_option('esn_homepage_hero_description', sanitize_textarea_field($_POST['esn_homepage_hero_description']));
        }
    }
    
    private function save_aboutus_content() {
        $fields = array(
            'esn_aboutus_hero_heading', 'esn_aboutus_hero_subheading',
            'esn_aboutus_stat1_number', 'esn_aboutus_stat1_label',
            'esn_aboutus_stat2_number', 'esn_aboutus_stat2_label',
            'esn_aboutus_stat3_number', 'esn_aboutus_stat3_label',
            'esn_aboutus_stat4_number', 'esn_aboutus_stat4_label',
            'esn_aboutus_about_heading', 'esn_aboutus_training_heading',
            'esn_aboutus_cta_heading'
        );
        
        $textarea_fields = array(
            'esn_aboutus_about_paragraph1', 'esn_aboutus_about_paragraph2',
            'esn_aboutus_training_description', 'esn_aboutus_cta_description'
        );
        
        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                update_option($field, sanitize_text_field($_POST[$field]));
            }
        }
        
        foreach ($textarea_fields as $field) {
            if (isset($_POST[$field])) {
                update_option($field, sanitize_textarea_field($_POST[$field]));
            }
        }
    }
}
