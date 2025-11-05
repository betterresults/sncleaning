<?php
/**
 * Admin Dashboard for ESN Page Templates
 */

class ESN_Admin_Dashboard {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_ajax_esn_bulk_assign_template', array($this, 'handle_bulk_assign'));
        add_action('wp_ajax_esn_filter_pages', array($this, 'handle_filter_pages'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'ESN Templates',
            'ESN Templates',
            'manage_options',
            'esn-templates',
            array($this, 'admin_page'),
            'dashicons-layout',
            30
        );
    }

    public function register_settings() {
        register_setting('esn_templates_settings', 'esn_default_template_name');
        register_setting('esn_templates_settings', 'esn_use_custom_header');
        register_setting('esn_templates_settings', 'esn_use_custom_footer');
    }

    public function admin_page() {
        ?>
        <div class="wrap esn-admin-wrap">
            <h1>ESN Page Templates</h1>
            
            <div class="esn-admin-container">
                <!-- Settings Section -->
                <div class="esn-section esn-settings-section">
                    <h2>Template Settings</h2>
                    <form method="post" action="options.php">
                        <?php settings_fields('esn_templates_settings'); ?>
                        <?php do_settings_sections('esn_templates_settings'); ?>
                        
                        <table class="form-table">
                            <tr>
                                <th scope="row">Use ESN Header Site-wide</th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="esn_use_custom_header" value="1" <?php checked(1, get_option('esn_use_custom_header'), true); ?> />
                                        Enable custom ESN header across your entire website
                                    </label>
                                    <p class="description">When enabled, the ESN header will be used on all pages instead of your theme's default header.</p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Use ESN Footer Site-wide</th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="esn_use_custom_footer" value="1" <?php checked(1, get_option('esn_use_custom_footer'), true); ?> />
                                        Enable custom ESN footer across your entire website
                                    </label>
                                    <p class="description">When enabled, the ESN footer will be used on all pages instead of your theme's default footer.</p>
                                </td>
                            </tr>
                        </table>
                        
                        <?php submit_button(); ?>
                    </form>
                </div>

                <!-- Templates Section -->
                <div class="esn-section esn-templates-section">
                    <h2>Available Templates</h2>
                    <div class="esn-templates-grid">
                        <?php $this->render_templates(); ?>
                    </div>
                </div>

                <!-- Pages Management Section -->
                <div class="esn-section esn-pages-section">
                    <div class="esn-pages-header">
                        <h2>Pages Management</h2>
                        <div class="esn-filters">
                            <input type="text" id="esn-keyword-filter" placeholder="Search pages..." />
                            <select id="esn-category-filter">
                                <option value="">All Categories</option>
                                <?php $this->render_category_options(); ?>
                            </select>
                            <select id="esn-template-filter">
                                <option value="">All Templates</option>
                                <option value="service-cleaning-template.php">End of Tenancy Cleaning Borough Templates</option>
                                <option value="homepage-template.php">ESN Homepage Template</option>
                                <option value="no-template">No Template</option>
                            </select>
                            <button id="esn-filter-btn" class="button">Filter</button>
                        </div>
                    </div>

                    <div class="esn-bulk-actions">
                        <select id="esn-bulk-template">
                            <option value="">Select Template to Assign</option>
                            <option value="service-cleaning-template.php">End of Tenancy Cleaning Borough Templates</option>
                            <option value="homepage-template.php">ESN Homepage Template</option>
                            <option value="remove-template">Remove Template</option>
                        </select>
                        <button id="esn-bulk-assign" class="button button-primary" disabled>Apply to Selected</button>
                        <span class="esn-selected-count">0 pages selected</span>
                    </div>

                    <div id="esn-pages-list">
                        <?php $this->render_pages_list(); ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Template Details Modal -->
        <div id="esn-template-modal" class="esn-modal" style="display: none;">
            <div class="esn-modal-content">
                <div class="esn-modal-header">
                    <h2 id="esn-modal-title">Template Details</h2>
                    <span class="esn-modal-close">&times;</span>
                </div>
                <div id="esn-modal-body" class="esn-modal-body">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        </div>

        <style>
        .esn-admin-wrap {
            max-width: 1200px;
        }
        
        .esn-admin-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
            margin-top: 20px;
        }
        
        .esn-section {
            background: #fff;
            border: 1px solid #ccd0d4;
            border-radius: 4px;
            padding: 20px;
        }
        
        .esn-section h2 {
            margin-top: 0;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        
        /* Templates Grid */
        .esn-templates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .esn-template-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            background: #f9f9f9;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        
        .esn-template-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .esn-template-preview {
            height: 250px;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        .esn-template-layout {
            width: 90%;
            height: 90%;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .esn-preview-section {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 2px;
            font-size: 10px;
            text-align: center;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .esn-preview-section.esn-hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            flex: 2;
            font-weight: bold;
        }
        
        .esn-preview-section.esn-about {
            background: #4CAF50;
        }
        
        .esn-preview-section.esn-process {
            background: #2196F3;
        }
        
        .esn-preview-section.esn-testimonials {
            background: #FF9800;
        }
        
        .esn-preview-section.esn-checklist {
            background: #9C27B0;
        }
        
        .esn-preview-section.esn-content {
            background: #607D8B;
        }
        
        .esn-preview-section.esn-areas {
            background: #795548;
        }
        
        .esn-preview-section.esn-guarantee {
            background: #F44336;
        }
        
        .esn-preview-section.esn-faq {
            background: #009688;
        }
        
        .esn-template-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .esn-template-card:hover .esn-template-overlay {
            opacity: 1;
        }
        
        .esn-template-info {
            padding: 15px;
        }
        
        .esn-template-info h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        
        .esn-template-info p {
            margin: 0;
            color: #666;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .esn-template-stats {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 12px;
            color: #999;
        }
        
        .esn-template-status {
            color: #4CAF50 !important;
            font-weight: 600;
        }
        
        /* Pages Section */
        .esn-pages-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .esn-filters {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .esn-filters input, .esn-filters select {
            min-width: 150px;
        }
        
        .esn-bulk-actions {
            background: #f1f1f1;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .esn-selected-count {
            color: #666;
            font-weight: 500;
        }
        
        /* Pages List */
        .esn-pages-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .esn-pages-table th,
        .esn-pages-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        .esn-pages-table th {
            background: #f8f9fa;
            font-weight: 600;
        }
        
        .esn-pages-table tr:hover {
            background: #f8f9fa;
        }
        
        .esn-page-title {
            font-weight: 600;
        }
        
        .esn-page-title a {
            text-decoration: none;
            color: #0073aa;
        }
        
        .esn-page-title a:hover {
            color: #005177;
        }
        
        .esn-template-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .esn-template-badge.has-template {
            background: #d4edda;
            color: #155724;
        }
        
        .esn-template-badge.no-template {
            background: #f8d7da;
            color: #721c24;
        }
        
        .esn-page-actions {
            display: flex;
            gap: 5px;
        }
        
        .esn-page-actions .button {
            padding: 4px 8px;
            font-size: 11px;
        }
        
        .esn-loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .esn-no-results {
            text-align: center;
            padding: 40px;
            color: #999;
        }
        
        /* Modal Styles */
        .esn-modal {
            position: fixed;
            z-index: 100000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .esn-modal-content {
            background-color: #fefefe;
            margin: 5% auto;
            padding: 0;
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .esn-modal-header {
            padding: 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 8px 8px 0 0;
        }
        
        .esn-modal-header h2 {
            margin: 0;
            border: none;
            padding: 0;
        }
        
        .esn-modal-close {
            color: #aaa;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .esn-modal-close:hover {
            color: #000;
        }
        
        .esn-modal-body {
            padding: 20px;
        }
        
        .esn-template-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .esn-template-meta {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
        }
        
        .esn-template-meta h3 {
            margin-top: 0;
            color: #333;
        }
        
        .esn-template-sections {
            background: #fff;
            border: 1px solid #eee;
            padding: 20px;
            border-radius: 6px;
        }
        
        .esn-section-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .esn-section-list li {
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .esn-section-list li:last-child {
            border-bottom: none;
        }
        
        .esn-section-name {
            font-weight: 600;
            color: #333;
        }
        
        .esn-section-desc {
            color: #666;
            font-size: 13px;
        }
        
        .esn-fields-list {
            list-style: none;
            padding: 0;
            margin: 15px 0 0 0;
        }
        
        .esn-fields-list li {
            padding: 5px 0;
            color: #555;
            font-size: 14px;
        }
        
        .esn-fields-list li:before {
            content: "✓ ";
            color: #4CAF50;
            font-weight: bold;
        }
        
        @media (max-width: 768px) {
            .esn-pages-header {
                flex-direction: column;
                align-items: stretch;
            }
            
            .esn-filters {
                justify-content: stretch;
            }
            
            .esn-filters input, .esn-filters select {
                flex: 1;
                min-width: auto;
            }
            
            .esn-bulk-actions {
                flex-direction: column;
                align-items: stretch;
            }
            
            .esn-template-details {
                grid-template-columns: 1fr;
            }
        }
        </style>

        <script>
        jQuery(document).ready(function($) {
            let selectedPages = new Set();
            
            // Template data for modal
            const templates = {
                'service-cleaning-template.php': {
                    name: 'End of Tenancy Cleaning Borough Templates',
                    description: 'Complete template for end of tenancy cleaning service pages with hero section, about, 3-step process, testimonials, checklist, content sections, FAQs, service areas, and guarantee.',
                    sections: {
                        'Hero Section': 'Dynamic H1, area, borough, hero image',
                        'About Section': 'Company information and stats',
                        '3-Step Process': 'Booking process explanation', 
                        'Why Choose Us': 'Service highlights and benefits',
                        'Testimonials': 'Customer reviews and ratings',
                        'Checklist': 'Detailed service checklist',
                        'Content Sections': 'Dynamic H2, H3, H4 with content',
                        'Service Areas': 'Coverage area listing',
                        'FAQ Section': 'Frequently asked questions',
                        'Guarantee': 'Cast iron guarantee section'
                    },
                    fields: [
                        'Page Title & Meta Description',
                        'Hero H1, Image, Area, Borough',
                        'About Section Heading & Description', 
                        'Content H2, H3, H4 with Paragraphs',
                        'Content Image with SEO optimization',
                        'FAQ Questions & Answers',
                        'Service area customization'
                    ]
                }
            };
            
            // Handle template card clicks
            $('.esn-template-card').click(function() {
                const templateKey = $(this).data('template');
                const template = templates[templateKey];
                
                if (template) {
                    showTemplateModal(template);
                }
            });
            
            // Show template modal
            function showTemplateModal(template) {
                $('#esn-modal-title').text(template.name);
                
                let modalContent = '<div class="esn-template-details">';
                
                // Template metadata
                modalContent += '<div class="esn-template-meta">';
                modalContent += '<h3>Template Information</h3>';
                modalContent += '<p><strong>Name:</strong> ' + template.name + '</p>';
                modalContent += '<p><strong>Description:</strong> ' + template.description + '</p>';
                modalContent += '<p><strong>Status:</strong> <span style="color: #4CAF50;">Active</span></p>';
                
                modalContent += '<h3>Available Fields</h3>';
                modalContent += '<ul class="esn-fields-list">';
                template.fields.forEach(function(field) {
                    modalContent += '<li>' + field + '</li>';
                });
                modalContent += '</ul>';
                modalContent += '</div>';
                
                // Template sections
                modalContent += '<div class="esn-template-sections">';
                modalContent += '<h3>Template Sections</h3>';
                modalContent += '<ul class="esn-section-list">';
                Object.keys(template.sections).forEach(function(section) {
                    modalContent += '<li>';
                    modalContent += '<div class="esn-section-name">' + section + '</div>';
                    modalContent += '<div class="esn-section-desc">' + template.sections[section] + '</div>';
                    modalContent += '</li>';
                });
                modalContent += '</ul>';
                modalContent += '</div>';
                
                modalContent += '</div>';
                
                $('#esn-modal-body').html(modalContent);
                $('#esn-template-modal').show();
            }
            
            // Close modal
            $('.esn-modal-close, .esn-modal').click(function(e) {
                if (e.target === this) {
                    $('#esn-template-modal').hide();
                }
            });
            
            // Handle page selection
            $(document).on('change', '.esn-page-checkbox', function() {
                const pageId = $(this).val();
                if ($(this).is(':checked')) {
                    selectedPages.add(pageId);
                } else {
                    selectedPages.delete(pageId);
                }
                updateBulkActions();
            });
            
            // Handle select all
            $(document).on('change', '#esn-select-all', function() {
                const isChecked = $(this).is(':checked');
                $('.esn-page-checkbox').prop('checked', isChecked);
                
                selectedPages.clear();
                if (isChecked) {
                    $('.esn-page-checkbox').each(function() {
                        selectedPages.add($(this).val());
                    });
                }
                updateBulkActions();
            });
            
            // Update bulk actions state
            function updateBulkActions() {
                const count = selectedPages.size;
                $('.esn-selected-count').text(count + ' pages selected');
                $('#esn-bulk-assign').prop('disabled', count === 0 || $('#esn-bulk-template').val() === '');
            }
            
            // Handle bulk template assignment
            $('#esn-bulk-assign').click(function() {
                const template = $('#esn-bulk-template').val();
                const pageIds = Array.from(selectedPages);
                
                if (!template || pageIds.length === 0) return;
                
                const button = $(this);
                button.prop('disabled', true).text('Processing...');
                
                $.post(ajaxurl, {
                    action: 'esn_bulk_assign_template',
                    template: template,
                    page_ids: pageIds,
                    nonce: '<?php echo wp_create_nonce('esn_bulk_assign'); ?>'
                }, function(response) {
                    if (response.success) {
                        alert('Templates assigned successfully!');
                        filterPages(); // Refresh the list
                        selectedPages.clear();
                        $('.esn-page-checkbox, #esn-select-all').prop('checked', false);
                        updateBulkActions();
                    } else {
                        alert('Error: ' + response.data);
                    }
                }).always(function() {
                    button.prop('disabled', false).text('Apply to Selected');
                });
            });
            
            // Handle template selection change
            $('#esn-bulk-template').change(updateBulkActions);
            
            // Handle filtering
            $('#esn-filter-btn').click(filterPages);
            $('#esn-keyword-filter').keypress(function(e) {
                if (e.which === 13) filterPages();
            });
            
            function filterPages() {
                const keyword = $('#esn-keyword-filter').val();
                const category = $('#esn-category-filter').val();
                const template = $('#esn-template-filter').val();
                
                $('#esn-pages-list').html('<div class="esn-loading">Loading...</div>');
                
                $.post(ajaxurl, {
                    action: 'esn_filter_pages',
                    keyword: keyword,
                    category: category,
                    template: template,
                    nonce: '<?php echo wp_create_nonce('esn_filter_pages'); ?>'
                }, function(response) {
                    if (response.success) {
                        $('#esn-pages-list').html(response.data);
                        selectedPages.clear();
                        updateBulkActions();
                    } else {
                        $('#esn-pages-list').html('<div class="esn-no-results">Error loading pages</div>');
                    }
                });
            }
        });
        </script>
        <?php
    }

    private function render_templates() {
        $templates = array(
            'homepage-template.php' => array(
                'name' => 'ESN Homepage Template',
                'description' => 'Complete homepage template with hero section, services, features, testimonials, service areas, FAQ, and call-to-action sections.',
                'pages_count' => $this->count_pages_using_template('homepage-template.php'),
                'sections' => array(
                    'Hero Section' => 'Dynamic hero with quote form',
                    'Service Types' => 'All cleaning services grid',
                    'Features' => 'Why choose us section',
                    'Booking Process' => 'Simple 3-step process',
                    'Testimonials' => 'Customer reviews',
                    'Service Areas' => 'London & Essex coverage',
                    'Call to Action' => 'Get instant quote',
                    'FAQ Section' => 'Frequently asked questions'
                ),
                'fields' => array(
                    'Fully responsive design',
                    'Modern animations and transitions',
                    'Mobile-optimized layout',
                    'SEO-friendly structure',
                    'Built-in contact forms',
                    'Service area mapping'
                )
            ),
            'service-cleaning-template.php' => array(
                'name' => 'End of Tenancy Cleaning Borough Templates',
                'description' => 'Complete template for end of tenancy cleaning service pages with hero section, about, 3-step process, testimonials, checklist, content sections, FAQs, service areas, and guarantee.',
                'pages_count' => $this->count_pages_using_template('service-cleaning-template.php'),
                'sections' => array(
                    'Hero Section' => 'Dynamic H1, area, borough, hero image',
                    'About Section' => 'Company information and stats',
                    '3-Step Process' => 'Booking process explanation', 
                    'Why Choose Us' => 'Service highlights and benefits',
                    'Testimonials' => 'Customer reviews and ratings',
                    'Checklist' => 'Detailed service checklist',
                    'Content Sections' => 'Dynamic H2, H3, H4 with content',
                    'Service Areas' => 'Coverage area listing',
                    'FAQ Section' => 'Frequently asked questions',
                    'Guarantee' => 'Cast iron guarantee section'
                ),
                'fields' => array(
                    'Page Title & Meta Description',
                    'Hero H1, Image, Area, Borough',
                    'About Section Heading & Description', 
                    'Content H2, H3, H4 with Paragraphs',
                    'Content Image with SEO optimization',
                    'FAQ Questions & Answers',
                    'Service area customization'
                )
            )
        );
        
        foreach ($templates as $template_key => $template_data) {
            ?>
            <div class="esn-template-card" data-template="<?php echo esc_attr($template_key); ?>">
                <div class="esn-template-preview">
                    <div class="esn-template-layout">
                        <?php if ($template_key === 'homepage-template.php'): ?>
                            <div class="esn-preview-section esn-hero">Hero Section</div>
                            <div class="esn-preview-section esn-about">Service Types</div>
                            <div class="esn-preview-section esn-process">Features</div>
                            <div class="esn-preview-section esn-testimonials">Testimonials</div>
                            <div class="esn-preview-section esn-areas">Service Areas</div>
                            <div class="esn-preview-section esn-guarantee">Call to Action</div>
                            <div class="esn-preview-section esn-faq">FAQ</div>
                        <?php else: ?>
                            <div class="esn-preview-section esn-hero">[page_h1]</div>
                            <div class="esn-preview-section esn-about">[page_h2]</div>
                            <div class="esn-preview-section esn-process">Our 3-Step Process</div>
                            <div class="esn-preview-section esn-testimonials">What Our Customers Say</div>
                            <div class="esn-preview-section esn-checklist">Service Checklist</div>
                            <div class="esn-preview-section esn-content">[page_h3] & [page_h4]</div>
                            <div class="esn-preview-section esn-areas">Areas We Cover</div>
                            <div class="esn-preview-section esn-guarantee">Our Guarantee</div>
                            <div class="esn-preview-section esn-faq">FAQ</div>
                        <?php endif; ?>
                    </div>
                    <div class="esn-template-overlay">
                        <span>Click to view details</span>
                    </div>
                </div>
                <div class="esn-template-info">
                    <h3><?php echo esc_html($template_data['name']); ?></h3>
                    <p><?php echo esc_html($template_data['description']); ?></p>
                    <div class="esn-template-stats">
                        <span><?php echo $template_data['pages_count']; ?> pages using this template</span>
                        <span class="esn-template-status">Active</span>
                    </div>
                </div>
            </div>
            <?php
        }
    }

    private function render_category_options() {
        $categories = get_categories(array('hide_empty' => false));
        foreach ($categories as $category) {
            echo '<option value="' . esc_attr($category->term_id) . '">' . esc_html($category->name) . '</option>';
        }
    }

    private function render_pages_list() {
        $pages = get_posts(array(
            'post_type' => 'page',
            'posts_per_page' => -1,
            'post_status' => 'publish,draft',
            'orderby' => 'title',
            'order' => 'ASC'
        ));
        
        if (empty($pages)) {
            echo '<div class="esn-no-results">No pages found.</div>';
            return;
        }
        
        echo '<table class="esn-pages-table">';
        echo '<thead>';
        echo '<tr>';
        echo '<th><input type="checkbox" id="esn-select-all" /></th>';
        echo '<th>Page Title</th>';
        echo '<th>Status</th>';
        echo '<th>Template</th>';
        echo '<th>Category</th>';
        echo '<th>Actions</th>';
        echo '</tr>';
        echo '</thead>';
        echo '<tbody>';
        
        foreach ($pages as $page) {
            $template = get_page_template_slug($page->ID);
            $has_template = in_array($template, ['service-cleaning-template.php', 'homepage-template.php']);
            $categories = wp_get_post_categories($page->ID, array('fields' => 'names'));
            $category_names = implode(', ', $categories);
            
            echo '<tr>';
            echo '<td><input type="checkbox" class="esn-page-checkbox" value="' . $page->ID . '" /></td>';
            echo '<td>';
            echo '<div class="esn-page-title">';
            echo '<a href="' . admin_url('post.php?post=' . $page->ID . '&action=edit') . '">' . esc_html($page->post_title) . '</a>';
            echo '</div>';
            echo '</td>';
            echo '<td>' . ucfirst($page->post_status) . '</td>';
            echo '<td>';
            if ($template === 'service-cleaning-template.php') {
                echo '<span class="esn-template-badge has-template">Service Template</span>';
            } elseif ($template === 'homepage-template.php') {
                echo '<span class="esn-template-badge has-template">Homepage Template</span>';
            } else {
                echo '<span class="esn-template-badge no-template">No Template</span>';
            }
            echo '</td>';
            echo '<td>' . esc_html($category_names ?: 'Uncategorized') . '</td>';
            echo '<td>';
            echo '<div class="esn-page-actions">';
            echo '<a href="' . admin_url('post.php?post=' . $page->ID . '&action=edit') . '" class="button button-small">Edit</a>';
            echo '<a href="' . get_permalink($page->ID) . '" target="_blank" class="button button-small">View</a>';
            echo '</div>';
            echo '</td>';
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
    }

    public function handle_bulk_assign() {
        check_ajax_referer('esn_bulk_assign', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        $template = sanitize_text_field($_POST['template']);
        $page_ids = array_map('intval', $_POST['page_ids']);
        
        $success_count = 0;
        
        foreach ($page_ids as $page_id) {
            if ($template === 'remove-template') {
                update_post_meta($page_id, '_wp_page_template', 'default');
                delete_post_meta($page_id, '_esn_page_template');
            } else {
                update_post_meta($page_id, '_wp_page_template', $template);
                update_post_meta($page_id, '_esn_page_template', $template);
            }
            $success_count++;
        }
        
        wp_send_json_success($success_count . ' pages updated successfully');
    }

    public function handle_filter_pages() {
        check_ajax_referer('esn_filter_pages', 'nonce');
        
        $keyword = sanitize_text_field($_POST['keyword']);
        $category = intval($_POST['category']);
        $template = sanitize_text_field($_POST['template']);
        
        $args = array(
            'post_type' => 'page',
            'posts_per_page' => -1,
            'post_status' => 'publish,draft',
            'orderby' => 'title',
            'order' => 'ASC'
        );
        
        if (!empty($keyword)) {
            $args['s'] = $keyword;
        }
        
        if (!empty($category)) {
            $args['category'] = $category;
        }
        
        $pages = get_posts($args);
        
        // Filter by template
        if (!empty($template)) {
            $pages = array_filter($pages, function($page) use ($template) {
                $page_template = get_page_template_slug($page->ID);
                if ($template === 'no-template') {
                    return $page_template !== 'service-cleaning-template.php';
                }
                return $page_template === $template;
            });
        }
        
        ob_start();
        
        if (empty($pages)) {
            echo '<div class="esn-no-results">No pages found matching your criteria.</div>';
        } else {
            echo '<table class="esn-pages-table">';
            echo '<thead>';
            echo '<tr>';
            echo '<th><input type="checkbox" id="esn-select-all" /></th>';
            echo '<th>Page Title</th>';
            echo '<th>Status</th>';
            echo '<th>Template</th>';
            echo '<th>Category</th>';
            echo '<th>Actions</th>';
            echo '</tr>';
            echo '</thead>';
            echo '<tbody>';
            
            foreach ($pages as $page) {
                $template_slug = get_page_template_slug($page->ID);
                $has_template = $template_slug === 'service-cleaning-template.php';
                $categories = wp_get_post_categories($page->ID, array('fields' => 'names'));
                $category_names = implode(', ', $categories);
                
                echo '<tr>';
                echo '<td><input type="checkbox" class="esn-page-checkbox" value="' . $page->ID . '" /></td>';
                echo '<td>';
                echo '<div class="esn-page-title">';
                echo '<a href="' . admin_url('post.php?post=' . $page->ID . '&action=edit') . '">' . esc_html($page->post_title) . '</a>';
                echo '</div>';
                echo '</td>';
                echo '<td>' . ucfirst($page->post_status) . '</td>';
                echo '<td>';
                if ($has_template) {
                    echo '<span class="esn-template-badge has-template">Service Template</span>';
                } else {
                    echo '<span class="esn-template-badge no-template">No Template</span>';
                }
                echo '</td>';
                echo '<td>' . esc_html($category_names ?: 'Uncategorized') . '</td>';
                echo '<td>';
                echo '<div class="esn-page-actions">';
                echo '<a href="' . admin_url('post.php?post=' . $page->ID . '&action=edit') . '" class="button button-small">Edit</a>';
                echo '<a href="' . get_permalink($page->ID) . '" target="_blank" class="button button-small">View</a>';
                echo '</div>';
                echo '</td>';
                echo '</tr>';
            }
            
            echo '</tbody>';
            echo '</table>';
        }
        
        $output = ob_get_clean();
        wp_send_json_success($output);
    }

    private function count_pages_using_template($template) {
        return count(get_posts(array(
            'post_type' => 'page',
            'meta_key' => '_wp_page_template',
            'meta_value' => $template,
            'posts_per_page' => -1
        )));
    }
}