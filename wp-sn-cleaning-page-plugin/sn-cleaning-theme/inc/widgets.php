<?php
/**
 * Widget Areas and Custom Widgets
 * 
 * @package SN_Cleaning
 */

if (!defined('ABSPATH')) exit;

// Widget areas are already registered in functions.php
// This file contains custom widget classes

/**
 * Service Card Widget
 */
class SN_Service_Card_Widget extends WP_Widget {
    
    public function __construct() {
        parent::__construct(
            'sn_service_card',
            __('SN Service Card', 'sn-cleaning'),
            array('description' => __('Display a service card with icon, title, and description', 'sn-cleaning'))
        );
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];
        ?>
        <div class="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <?php if (!empty($instance['icon'])) : ?>
                <div class="text-4xl mb-4"><?php echo esc_html($instance['icon']); ?></div>
            <?php endif; ?>
            
            <?php if (!empty($instance['title'])) : ?>
                <h3 class="text-xl font-semibold mb-3"><?php echo esc_html($instance['title']); ?></h3>
            <?php endif; ?>
            
            <?php if (!empty($instance['description'])) : ?>
                <p class="text-muted-foreground"><?php echo esc_html($instance['description']); ?></p>
            <?php endif; ?>
            
            <?php if (!empty($instance['link'])) : ?>
                <a href="<?php echo esc_url($instance['link']); ?>" 
                   class="inline-block mt-4 text-primary hover:text-primary-dark font-semibold">
                    <?php _e('Learn More →', 'sn-cleaning'); ?>
                </a>
            <?php endif; ?>
        </div>
        <?php
        echo $args['after_widget'];
    }

    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : '';
        $description = !empty($instance['description']) ? $instance['description'] : '';
        $icon = !empty($instance['icon']) ? $instance['icon'] : '🧹';
        $link = !empty($instance['link']) ? $instance['link'] : '';
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('icon'); ?>"><?php _e('Icon (emoji):', 'sn-cleaning'); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id('icon'); ?>" 
                   name="<?php echo $this->get_field_name('icon'); ?>" type="text" 
                   value="<?php echo esc_attr($icon); ?>" />
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>"><?php _e('Title:', 'sn-cleaning'); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" 
                   name="<?php echo $this->get_field_name('title'); ?>" type="text" 
                   value="<?php echo esc_attr($title); ?>" />
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('description'); ?>"><?php _e('Description:', 'sn-cleaning'); ?></label>
            <textarea class="widefat" id="<?php echo $this->get_field_id('description'); ?>" 
                      name="<?php echo $this->get_field_name('description'); ?>" rows="3"><?php echo esc_textarea($description); ?></textarea>
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('link'); ?>"><?php _e('Link URL:', 'sn-cleaning'); ?></label>
            <input class="widefat" id="<?php echo $this->get_field_id('link'); ?>" 
                   name="<?php echo $this->get_field_name('link'); ?>" type="text" 
                   value="<?php echo esc_url($link); ?>" />
        </p>
        <?php
    }

    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? sanitize_text_field($new_instance['title']) : '';
        $instance['description'] = (!empty($new_instance['description'])) ? sanitize_textarea_field($new_instance['description']) : '';
        $instance['icon'] = (!empty($new_instance['icon'])) ? sanitize_text_field($new_instance['icon']) : '';
        $instance['link'] = (!empty($new_instance['link'])) ? esc_url_raw($new_instance['link']) : '';
        return $instance;
    }
}

function sn_register_widgets() {
    register_widget('SN_Service_Card_Widget');
}
add_action('widgets_init', 'sn_register_widgets');
