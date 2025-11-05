<?php
/**
 * WordPress Customizer Settings
 * Adds color and font controls to Appearance → Customize
 * 
 * @package SN_Cleaning
 */

if (!defined('ABSPATH')) exit;

function sn_customizer_settings($wp_customize) {
    
    // ===== COLORS SECTION =====
    $wp_customize->add_section('sn_colors', array(
        'title'    => __('SN Theme Colors', 'sn-cleaning'),
        'priority' => 30,
    ));

    // Primary Color
    $wp_customize->add_setting('sn_primary_color', array(
        'default'           => '#18A5A5',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control(new WP_Customize_Color_Control($wp_customize, 'sn_primary_color', array(
        'label'    => __('Primary Color', 'sn-cleaning'),
        'section'  => 'sn_colors',
        'settings' => 'sn_primary_color',
    )));

    // Primary Dark Color
    $wp_customize->add_setting('sn_primary_dark_color', array(
        'default'           => '#185166',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control(new WP_Customize_Color_Control($wp_customize, 'sn_primary_dark_color', array(
        'label'    => __('Primary Dark Color', 'sn-cleaning'),
        'section'  => 'sn_colors',
        'settings' => 'sn_primary_dark_color',
    )));

    // ===== TYPOGRAPHY SECTION =====
    $wp_customize->add_section('sn_typography', array(
        'title'    => __('SN Typography', 'sn-cleaning'),
        'priority' => 31,
    ));

    // Heading Font
    $wp_customize->add_setting('sn_heading_font', array(
        'default'           => 'Poppins',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control('sn_heading_font', array(
        'label'    => __('Heading Font', 'sn-cleaning'),
        'section'  => 'sn_typography',
        'type'     => 'select',
        'choices'  => array(
            'Poppins'     => 'Poppins',
            'Inter'       => 'Inter',
            'Roboto'      => 'Roboto',
            'Open Sans'   => 'Open Sans',
            'Lato'        => 'Lato',
            'Montserrat'  => 'Montserrat',
        ),
    ));

    // Body Font
    $wp_customize->add_setting('sn_body_font', array(
        'default'           => 'Inter',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ));
    $wp_customize->add_control('sn_body_font', array(
        'label'    => __('Body Font', 'sn-cleaning'),
        'section'  => 'sn_typography',
        'type'     => 'select',
        'choices'  => array(
            'Inter'       => 'Inter',
            'Poppins'     => 'Poppins',
            'Roboto'      => 'Roboto',
            'Open Sans'   => 'Open Sans',
            'Lato'        => 'Lato',
        ),
    ));
}
add_action('customize_register', 'sn_customizer_settings');

/**
 * Output customizer CSS
 */
function sn_customizer_css() {
    $primary_color = get_theme_mod('sn_primary_color', '#18A5A5');
    $primary_dark_color = get_theme_mod('sn_primary_dark_color', '#185166');
    $heading_font = get_theme_mod('sn_heading_font', 'Poppins');
    $body_font = get_theme_mod('sn_body_font', 'Inter');
    
    // Convert hex to HSL for CSS variables
    $primary_hsl = sn_hex_to_hsl($primary_color);
    $primary_dark_hsl = sn_hex_to_hsl($primary_dark_color);
    
    ?>
    <style type="text/css">
        :root {
            --primary: <?php echo $primary_hsl; ?>;
            --primary-dark: <?php echo $primary_dark_hsl; ?>;
        }
        
        body {
            font-family: '<?php echo esc_attr($body_font); ?>', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-family: '<?php echo esc_attr($heading_font); ?>', -apple-system, BlinkMacSystemFont, sans-serif;
        }
    </style>
    <?php
}
add_action('wp_head', 'sn_customizer_css');

/**
 * Helper: Convert HEX to HSL
 */
function sn_hex_to_hsl($hex) {
    $hex = str_replace('#', '', $hex);
    $r = hexdec(substr($hex, 0, 2)) / 255;
    $g = hexdec(substr($hex, 2, 2)) / 255;
    $b = hexdec(substr($hex, 4, 2)) / 255;
    
    $max = max($r, $g, $b);
    $min = min($r, $g, $b);
    $l = ($max + $min) / 2;
    
    if ($max == $min) {
        $h = $s = 0;
    } else {
        $diff = $max - $min;
        $s = $l > 0.5 ? $diff / (2 - $max - $min) : $diff / ($max + $min);
        
        switch ($max) {
            case $r:
                $h = ($g - $b) / $diff + ($g < $b ? 6 : 0);
                break;
            case $g:
                $h = ($b - $r) / $diff + 2;
                break;
            case $b:
                $h = ($r - $g) / $diff + 4;
                break;
        }
        $h = $h / 6;
    }
    
    $h = round($h * 360);
    $s = round($s * 100);
    $l = round($l * 100);
    
    return "$h $s% $l%";
}
