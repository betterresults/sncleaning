<?php
/**
 * Template Functions for ESN Page Templates
 */

/**
 * Get custom field value for current page
 */
function esn_get_field($field_name, $default = '') {
    global $post;
    if (!$post) return $default;
    
    $value = get_post_meta($post->ID, '_' . $field_name, true);
    return !empty($value) ? $value : $default;
}

/**
 * Display custom field value
 */
function esn_the_field($field_name, $default = '') {
    echo esc_html(esn_get_field($field_name, $default));
}

/**
 * Get custom field value with HTML allowed
 */
function esn_get_field_html($field_name, $default = '') {
    global $post;
    if (!$post) return $default;
    
    $value = get_post_meta($post->ID, '_' . $field_name, true);
    return !empty($value) ? $value : $default;
}

/**
 * Display custom field value with HTML allowed
 */
function esn_the_field_html($field_name, $default = '') {
    echo wp_kses_post(esn_get_field_html($field_name, $default));
}

/**
 * Check if current page uses ESN template
 */
function esn_is_template_page($template_name = '') {
    global $post;
    if (!$post) return false;
    
    $current_template = get_post_meta($post->ID, '_esn_page_template', true);
    
    if ($template_name) {
        return $current_template === $template_name;
    }
    
    return !empty($current_template);
}

/**
 * Get page title for ESN template
 */
function esn_get_page_title() {
    $custom_title = esn_get_field('page_title');
    if (!empty($custom_title)) {
        return $custom_title;
    }
    return get_the_title();
}

/**
 * Get service areas array
 */
function esn_get_service_areas() {
    return array(
        "South Hornchurch",
        "Hornchurch", 
        "Upminster",
        "Rainham",
        "Elm Park",
        "Romford",
        "Gidea Park",
        "Harold Wood",
        "Harold Hill",
        "Emerson Park",
        "Cranham",
        "North Ockendon"
    );
}

/**
 * Get static FAQ questions
 */
function esn_get_static_faqs() {
    return array(
        array(
            'question' => 'Do I need to be present during the cleaning?',
            'answer' => 'No, you don\'t need to be present. Many of our clients prefer to hand over the keys and let us work undisturbed. We\'re fully insured and bonded for your peace of mind.'
        ),
        array(
            'question' => 'What cleaning products do you use?',
            'answer' => 'We use professional-grade, eco-friendly cleaning products that are safe for all surfaces. All equipment and supplies are provided by us - you don\'t need to prepare anything.'
        ),
        array(
            'question' => 'How much does a cleaning service cost?',
            'answer' => 'Prices vary based on property size and condition. We offer competitive rates with no hidden fees. Contact us for a free, no-obligation quote tailored to your specific needs.'
        )
    );
}

/**
 * Download and rename image from URL for SEO
 */
function esn_process_image_from_url($image_url, $post_id, $image_type = 'hero') {
    if (empty($image_url) || !filter_var($image_url, FILTER_VALIDATE_URL)) {
        return false;
    }
    
    // Get custom image naming fields
    $custom_name = get_post_meta($post_id, '_' . $image_type . '_image_name', true);
    $custom_alt = get_post_meta($post_id, '_' . $image_type . '_image_alt', true);
    $custom_desc = get_post_meta($post_id, '_' . $image_type . '_image_desc', true);
    
    // Create SEO-friendly filename
    if (!empty($custom_name)) {
        $filename = sanitize_title($custom_name);
    } else {
        // Auto-generate from page data
        $page_title = get_post_meta($post_id, '_page_title', true) ?: get_the_title($post_id);
        $page_area = get_post_meta($post_id, '_page_area', true);
        $page_borough = get_post_meta($post_id, '_page_borough', true);
        $template_name = get_post_meta($post_id, '_esn_template_display_name', true) ?: 'cleaning-service';
        
        $filename_parts = array();
        if (!empty($page_area)) $filename_parts[] = sanitize_title($page_area);
        if (!empty($page_borough)) $filename_parts[] = sanitize_title($page_borough);
        $filename_parts[] = sanitize_title($template_name);
        $filename_parts[] = sanitize_title($page_title);
        
        $filename = implode('-', array_filter($filename_parts));
    }
    
    $filename = substr($filename, 0, 200); // Limit length
    
    // Get file extension from URL
    $path_info = pathinfo(parse_url($image_url, PHP_URL_PATH));
    $extension = isset($path_info['extension']) ? $path_info['extension'] : 'jpg';
    $filename .= '.' . $extension;
    
    // Download image
    $temp_file = download_url($image_url);
    if (is_wp_error($temp_file)) {
        return false;
    }
    
    // Prepare file array for media library
    $file_array = array(
        'name' => $filename,
        'tmp_name' => $temp_file
    );
    
    // Generate alt text
    if (!empty($custom_alt)) {
        $alt_text = $custom_alt;
    } else {
        // Auto-generate alt text
        $template_name = get_post_meta($post_id, '_esn_template_display_name', true) ?: 'cleaning service';
        $page_area = get_post_meta($post_id, '_page_area', true);
        $page_borough = get_post_meta($post_id, '_page_borough', true);
        
        $alt_text_parts = array();
        $alt_text_parts[] = $template_name;
        if (!empty($page_area)) $alt_text_parts[] = 'in ' . $page_area;
        if (!empty($page_borough)) $alt_text_parts[] = $page_borough;
        $alt_text = implode(' ', $alt_text_parts);
    }
    
    // Generate description
    $description = !empty($custom_desc) ? $custom_desc : $alt_text;
    
    // Insert into media library
    $id = media_handle_sideload($file_array, $post_id, $description);
    
    // Clean up temp file
    unlink($temp_file);
    
    if (is_wp_error($id)) {
        return false;
    }
    
    // Set alt text and description
    update_post_meta($id, '_wp_attachment_image_alt', $alt_text);
    wp_update_post(array(
        'ID' => $id,
        'post_excerpt' => $alt_text, // Caption
        'post_content' => $description   // Description
    ));
    
    return wp_get_attachment_url($id);
}