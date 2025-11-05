<?php
/**
 * Meta Boxes for SN Cleaning Theme Templates
 * Handles dynamic content fields for service page templates
 */

class SN_Meta_Boxes {

    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('save_post', array($this, 'save_meta_boxes'));
    }

    public function add_meta_boxes() {
        add_meta_box(
            'sn_service_page_fields',
            'Service Page Content Fields',
            array($this, 'service_page_fields_callback'),
            'page',
            'normal',
            'high'
        );
    }

    public function service_page_fields_callback($post) {
        wp_nonce_field('sn_service_meta_box_nonce', 'sn_service_meta_box_nonce');
        
        $template = get_page_template_slug($post->ID);
        
        // Only show fields if using the end of tenancy template
        if ($template !== 'template-end-of-tenancy.php') {
            echo '<p><strong>Note:</strong> These fields will be active when you select "End of Tenancy Cleaning" from the Page Attributes template dropdown.</p>';
        }
        
        $fields = array(
            // Hero Section
            'hero_h1' => array(
                'label' => 'Hero H1 Heading',
                'type' => 'text',
                'placeholder' => 'e.g., End of Tenancy Cleaning in Camden'
            ),
            'hero_subheading' => array(
                'label' => 'Hero Subheading',
                'type' => 'textarea',
                'placeholder' => 'e.g., Professional end of tenancy cleaning with 99.8% deposit return rate'
            ),
            
            // H2 Section
            'page_h2' => array(
                'label' => 'Page H2 Heading',
                'type' => 'text',
                'placeholder' => 'e.g., Expert End of Tenancy Cleaning Services'
            ),
            'page_h2_paragraph' => array(
                'label' => 'Page H2 Paragraph',
                'type' => 'textarea',
                'placeholder' => 'Detailed description for the H2 section'
            ),
            
            // Why Us Section (H3)
            'page_h3' => array(
                'label' => 'Page H3 Heading',
                'type' => 'text',
                'placeholder' => 'e.g., Why Choose Our End of Tenancy Cleaning Service?'
            ),
            'page_h3_paragraph' => array(
                'label' => 'Page H3 Paragraph',
                'type' => 'textarea',
                'placeholder' => 'Detailed explanation of why customers should choose your service'
            ),
            
            // Content Section (H4)
            'page_h4' => array(
                'label' => 'Page H4 Heading',
                'type' => 'text',
                'placeholder' => 'e.g., What Makes Us Different'
            ),
            'page_h4_paragraph_1' => array(
                'label' => 'Page H4 Paragraph 1',
                'type' => 'textarea',
                'placeholder' => 'First paragraph under H4'
            ),
            'page_h4_paragraph_2' => array(
                'label' => 'Page H4 Paragraph 2',
                'type' => 'textarea',
                'placeholder' => 'Second paragraph under H4'
            ),
            
            // Service Areas
            'page_borough' => array(
                'label' => 'Borough/Area Name',
                'type' => 'text',
                'placeholder' => 'e.g., Camden, Westminster, Islington'
            ),
            
            // FAQ Section (2 Dynamic Questions)
            'page_question_1' => array(
                'label' => 'FAQ Question 1 (Dynamic)',
                'type' => 'text',
                'placeholder' => 'Enter first FAQ question'
            ),
            'page_answer_1' => array(
                'label' => 'FAQ Answer 1 (Dynamic)',
                'type' => 'textarea',
                'placeholder' => 'Enter first FAQ answer'
            ),
            'page_question_2' => array(
                'label' => 'FAQ Question 2 (Dynamic)',
                'type' => 'text',
                'placeholder' => 'Enter second FAQ question'
            ),
            'page_answer_2' => array(
                'label' => 'FAQ Answer 2 (Dynamic)',
                'type' => 'textarea',
                'placeholder' => 'Enter second FAQ answer'
            ),
            
            // SEO Fields
            'meta_description' => array(
                'label' => 'Meta Description (SEO)',
                'type' => 'textarea',
                'placeholder' => 'SEO meta description (max 160 characters)'
            ),
        );

        echo '<div id="sn-service-fields" style="' . ($template === 'template-end-of-tenancy.php' ? 'background: #f0f8ff; padding: 15px; border-radius: 8px; border: 2px solid #185166;' : '') . '">';
        echo '<p><strong>Fill in these fields to customize your service page content:</strong></p>';
        echo '<table class="form-table">';
        
        foreach ($fields as $field_key => $field_data) {
            $field_value = get_post_meta($post->ID, '_' . $field_key, true);
            
            echo '<tr>';
            echo '<th scope="row"><label for="' . $field_key . '">' . $field_data['label'] . '</label></th>';
            echo '<td>';
            
            if ($field_data['type'] === 'textarea') {
                echo '<textarea name="' . $field_key . '" id="' . $field_key . '" class="widefat" rows="4" placeholder="' . esc_attr($field_data['placeholder']) . '">' . esc_textarea($field_value) . '</textarea>';
            } else {
                echo '<input type="text" name="' . $field_key . '" id="' . $field_key . '" value="' . esc_attr($field_value) . '" class="widefat" placeholder="' . esc_attr($field_data['placeholder']) . '" />';
            }
            
            echo '</td>';
            echo '</tr>';
        }
        
        echo '</table>';
        echo '</div>';
        
        // JavaScript to highlight fields when template is selected
        echo '<script>
        jQuery(document).ready(function($) {
            function toggleFieldsHighlight() {
                var selectedTemplate = $("#page_template").val();
                if (selectedTemplate === "template-end-of-tenancy.php") {
                    $("#sn-service-fields").css({
                        "background": "#f0f8ff",
                        "padding": "15px",
                        "border-radius": "8px",
                        "border": "2px solid #185166"
                    });
                } else {
                    $("#sn-service-fields").css({
                        "background": "",
                        "padding": "",
                        "border-radius": "",
                        "border": ""
                    });
                }
            }
            
            $(document).on("change", "#page_template", toggleFieldsHighlight);
            toggleFieldsHighlight();
        });
        </script>';
    }

    public function save_meta_boxes($post_id) {
        // Verify nonce
        if (!isset($_POST['sn_service_meta_box_nonce']) || !wp_verify_nonce($_POST['sn_service_meta_box_nonce'], 'sn_service_meta_box_nonce')) {
            return;
        }

        // Check permissions
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        // Don't save during autosave
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        // List of fields to save
        $fields = array(
            'hero_h1', 'hero_subheading', 'page_h2', 'page_h2_paragraph',
            'page_h3', 'page_h3_paragraph', 'page_h4',
            'page_h4_paragraph_1', 'page_h4_paragraph_2', 'page_borough',
            'page_question_1', 'page_answer_1', 'page_question_2', 'page_answer_2',
            'meta_description'
        );
        
        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                $value = $_POST[$field];
                // Use wp_kses_post for textareas to allow basic HTML
                if (strpos($field, 'paragraph') !== false || strpos($field, 'description') !== false || strpos($field, 'answer') !== false) {
                    $value = wp_kses_post($value);
                } else {
                    $value = sanitize_text_field($value);
                }
                update_post_meta($post_id, '_' . $field, $value);
            }
        }
    }
}

// Initialize the meta boxes
new SN_Meta_Boxes();
