# ESN Page Templates WordPress Plugin

A WordPress plugin that provides custom page templates with dynamic content fields for service pages.

## Features

- **Template Selection**: Choose from available templates in the page editor
- **Dynamic Content Fields**: 13 customizable fields for different content areas
- **Meta Box Integration**: Easy-to-use admin interface for content management
- **Responsive Design**: Mobile-friendly templates with modern styling
- **SEO Optimized**: Proper heading structure and meta tag support

## Installation

1. Upload the `esn-page-templates` folder to your `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Create a new page and select "Service Cleaning Template" from the template dropdown
4. Fill in the dynamic content fields in the meta boxes
5. Publish your page

## Template Fields

### Hero Section
- **Page Title**: Browser tab title
- **Page H1**: Main heading
- **Under Heading**: Subtitle text
- **Page Area**: Service area/location
- **Page Borough**: Borough information

### About Section
- **Page Subheading**: About section heading
- **Page Subheading Description**: About section content

### Content Section
- **Page H2**: First content heading
- **Page H2 Paragraph**: First content paragraph
- **Page H3**: Second content heading
- **Page H3 Paragraph**: Second content paragraph

### FAQ Section
- **Page Question 1**: First dynamic FAQ question
- **Page Question 2**: Second dynamic FAQ question
- Plus 3 static FAQ questions that appear on all pages

## Template Functions

Use these functions in your custom templates:

```php
// Get field value
$value = esn_get_field('field_name', 'default_value');

// Display field value (escaped)
esn_the_field('field_name', 'default_value');

// Get field value with HTML allowed
$html_value = esn_get_field_html('field_name', 'default_value');

// Display field value with HTML allowed
esn_the_field_html('field_name', 'default_value');

// Check if page uses ESN template
if (esn_is_template_page('service-cleaning-template')) {
    // Template-specific code
}
```

## Static Sections

The following sections are static and appear the same on all pages:
- 3-Step Process
- Testimonials
- Cleaning Checklist  
- Cast Iron Guarantee
- Why Choose Us

## Customization

### Adding New Templates

1. Create a new PHP file in the `templates/` directory
2. Add the template option in `inc/meta-boxes.php`
3. Update the template loader in `inc/template-loader.php`

### Styling

Customize the appearance by editing `assets/style.css`. The plugin uses CSS custom properties for easy theming.

### Adding Fields

1. Add new fields to the `$fields` array in `inc/meta-boxes.php`
2. Update the save function to handle the new fields
3. Use the template functions to display the new fields

## Support

For support and customization requests, please contact the development team.

## Version

Current version: 1.0.0