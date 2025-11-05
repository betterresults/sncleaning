# SN Cleaning WordPress Theme

A custom WordPress theme built specifically for SN Cleaning Services with fully editable content via WordPress dashboard.

## Features

✅ **Fully Editable Content** - Edit all page content from WordPress admin
✅ **Modern Design System** - Beautiful Tailwind CSS-based design
✅ **3 Main Templates** - Homepage, About Us, End of Tenancy
✅ **Color & Font Customization** - Change colors and fonts from WordPress Customizer
✅ **Reusable Widgets** - Service cards, stats, CTAs
✅ **Shortcode System** - Insert content blocks anywhere
✅ **Mobile Responsive** - Perfect on all devices
✅ **SEO Optimized** - Built-in SEO best practices
✅ **Fast Performance** - Optimized for speed

## Installation

1. **Upload Theme**
   - Download the `sn-cleaning-theme` folder
   - Upload to `/wp-content/themes/` on your WordPress site
   - Or zip the folder and upload via WordPress admin

2. **Activate Theme**
   - Go to Appearance → Themes
   - Find "SN Cleaning Services"
   - Click "Activate"

3. **Configure Settings**
   - Go to **SN Cleaning → Theme Settings**
   - Fill in your content for Homepage, About Us, etc.
   - Go to **Appearance → Customize** to change colors & fonts

4. **Set Up Menus**
   - Go to Appearance → Menus
   - Create menus for Primary, Services, and Footer locations
   - Assign them to their respective locations

5. **Upload Logo**
   - Go to Appearance → Customize → Site Identity
   - Upload your logo

## Page Templates

### Homepage (front-page.php)
Automatically used for your homepage. Edit content via:
- **SN Cleaning → Theme Settings → Homepage tab**

Content you can edit:
- Hero heading & subheading
- Hero background image
- 4 Statistics (number + label)
- 10 Service cards (title, description, link)

### About Us (page-about.php)
Create a new page and assign the "About Us" template. Edit via:
- **SN Cleaning → Theme Settings → About tab**

Content you can edit:
- Hero heading & subheading
- Main "Who We Are" content
- 4 Training/certification points

### End of Tenancy (end-of-tenancy.php)
Create pages for service templates and assign "End of Tenancy Cleaning". Edit via:
- **SN Cleaning → Theme Settings → Service Template tab**

Content you can edit:
- Hero heading & subheading
- Process steps
- Checklist items

## Customization

### Change Colors
1. Go to **Appearance → Customize**
2. Open **SN Theme Colors**
3. Choose your colors:
   - Primary Color (default: #18A5A5)
   - Primary Dark Color (default: #185166)
4. Click "Publish"

### Change Fonts
1. Go to **Appearance → Customize**
2. Open **SN Typography**
3. Choose fonts:
   - Heading Font (default: Poppins)
   - Body Font (default: Inter)
4. Click "Publish"

### Global Settings
Edit contact info and business details:
1. Go to **SN Cleaning → Theme Settings → Global Settings**
2. Update:
   - Phone number
   - WhatsApp number
   - Email address
   - Service area
   - Company number
   - Booking URL
   - Footer description

## Shortcodes

Use these anywhere in WordPress content:

```
[sn_hero title="Custom Title" image="url"]
[sn_stats]
[sn_cta button_text="Book Now" button_url="/booking"]
[sn_service_card title="Service Name" icon="🧹"]
[sn_features]
```

## Widgets

**Service Card Widget**
- Drag to any widget area
- Perfect for sidebars and footers
- Fields: Icon, Title, Description, Link

## Navigation Menus

The theme has 3 menu locations:

1. **Primary Menu** - Main header navigation
2. **Services Menu** - Services dropdown/footer
3. **Footer Menu** - Quick links in footer

Set them up in **Appearance → Menus**

## Support & Documentation

For questions or support:
- Email: info@sncleaningservices.co.uk
- Phone: 020 3835 5033

## Changelog

### Version 1.0.0
- Initial release
- Homepage template
- About Us template
- End of Tenancy template
- Admin settings panel
- WordPress Customizer integration
- Shortcode system
- Widget system
