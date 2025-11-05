<?php
/**
 * Template Name: Contact Us
 * Template for Contact Us page
 * 
 * @package SN_Cleaning
 */

get_header();
?>

<main id="main-content" class="min-h-screen bg-background">
    
    <!-- Hero Section -->
    <section class="relative py-20 overflow-hidden" style="background: linear-gradient(135deg, #185166 0%, #134555 50%, #185166 100%);">
        <div class="absolute inset-0">
            <div class="absolute top-1/4 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-xl animate-float"></div>
            <div class="absolute bottom-1/4 right-1/4 w-32 h-32 bg-white/20 rounded-full blur-lg animate-float" style="animation-delay: 2s;"></div>
        </div>
        
        <div class="section-container relative z-10">
            <div class="max-w-4xl mx-auto text-center text-white">
                <h1 class="text-5xl lg:text-6xl font-bold font-heading mb-6">
                    Get In Touch
                </h1>
                <p class="text-xl lg:text-2xl text-white/90 leading-relaxed">
                    Have questions? We're here to help! Reach out to our friendly team and we'll get back to you as soon as possible.
                </p>
            </div>
        </div>
    </section>

    <!-- Contact Content Section -->
    <section class="section-padding bg-gradient-to-b from-muted/30 to-background">
        <div class="section-container">
            <div class="grid lg:grid-cols-2 gap-12 lg:gap-16">
                
                <!-- Contact Information -->
                <div class="space-y-8">
                    <div>
                        <h2 class="text-3xl lg:text-4xl font-bold font-heading text-foreground mb-6">
                            Contact Information
                        </h2>
                        <p class="text-lg text-muted-foreground leading-relaxed">
                            Get in touch with us today for a free, no-obligation quote. Our friendly team is available 24/7 to answer your questions.
                        </p>
                    </div>

                    <!-- Contact Cards -->
                    <div class="space-y-4">
                        <!-- Phone -->
                        <div class="bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: #185166;">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-foreground mb-1">Phone</h3>
                                    <a href="tel:02038355033" class="text-muted-foreground hover:text-primary transition-colors text-lg">
                                        02038355033
                                    </a>
                                    <p class="text-sm text-muted-foreground mt-1">Available 24/7</p>
                                </div>
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: #185166;">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-foreground mb-1">Email</h3>
                                    <a href="mailto:<?php echo esc_attr(sn_get_option('email', 'info@sncleaningservices.co.uk')); ?>" class="text-muted-foreground hover:text-primary transition-colors text-lg">
                                        <?php echo esc_html(sn_get_option('email', 'info@sncleaningservices.co.uk')); ?>
                                    </a>
                                    <p class="text-sm text-muted-foreground mt-1">Response within 1 hour</p>
                                </div>
                            </div>
                        </div>

                        <!-- Address -->
                        <div class="bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background-color: #185166;">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-foreground mb-1">Service Area</h3>
                                    <p class="text-muted-foreground text-lg">London & Essex</p>
                                    <p class="text-sm text-muted-foreground mt-1">Covering all postcodes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Opening Hours -->
                    <div class="bg-background rounded-2xl p-6 shadow-lg border border-gray-200">
                        <h3 class="text-xl font-bold text-foreground mb-4">Opening Hours</h3>
                        <div class="space-y-2 text-muted-foreground">
                            <div class="flex justify-between">
                                <span>Monday - Friday:</span>
                                <span class="font-semibold text-foreground">7:00 AM - 8:00 PM</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Saturday:</span>
                                <span class="font-semibold text-foreground">8:00 AM - 6:00 PM</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Sunday:</span>
                                <span class="font-semibold text-foreground">9:00 AM - 5:00 PM</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contact Form -->
                <div class="bg-background rounded-3xl p-8 shadow-2xl border border-gray-200">
                    <h2 class="text-3xl font-bold font-heading text-foreground mb-6">
                        Send Us A Message
                    </h2>
                    
                    <?php
                    // Handle form submission
                    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['contact_form_nonce'])) {
                        if (wp_verify_nonce($_POST['contact_form_nonce'], 'contact_form_submit')) {
                            $name = sanitize_text_field($_POST['name']);
                            $email = sanitize_email($_POST['email']);
                            $phone = sanitize_text_field($_POST['phone']);
                            $message = sanitize_textarea_field($_POST['message']);
                            
                            $to = sn_get_option('email', get_option('admin_email'));
                            $subject = 'New Contact Form Submission - ' . get_bloginfo('name');
                            $body = "Name: $name\n";
                            $body .= "Email: $email\n";
                            $body .= "Phone: $phone\n\n";
                            $body .= "Message:\n$message";
                            
                            $headers = array('Content-Type: text/plain; charset=UTF-8');
                            
                            if (wp_mail($to, $subject, $body, $headers)) {
                                echo '<div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">Thank you! Your message has been sent successfully. We\'ll get back to you soon.</div>';
                            } else {
                                echo '<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">Sorry, there was an error sending your message. Please try again or contact us directly.</div>';
                            }
                        }
                    }
                    ?>
                    
                    <form method="POST" action="" class="space-y-4">
                        <?php wp_nonce_field('contact_form_submit', 'contact_form_nonce'); ?>
                        
                        <div>
                            <label for="name" class="block text-sm font-semibold text-foreground mb-2">Full Name *</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                required 
                                maxlength="100"
                                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="John Smith"
                            />
                        </div>
                        
                        <div>
                            <label for="email" class="block text-sm font-semibold text-foreground mb-2">Email Address *</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                required 
                                maxlength="255"
                                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="john@example.com"
                            />
                        </div>
                        
                        <div>
                            <label for="phone" class="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
                            <input 
                                type="tel" 
                                id="phone" 
                                name="phone" 
                                maxlength="20"
                                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                placeholder="020 1234 5678"
                            />
                        </div>
                        
                        <div>
                            <label for="message" class="block text-sm font-semibold text-foreground mb-2">Message *</label>
                            <textarea 
                                id="message" 
                                name="message" 
                                required 
                                maxlength="1000"
                                rows="5"
                                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                placeholder="Tell us about your cleaning needs..."
                            ></textarea>
                        </div>
                        
                        <button 
                            type="submit" 
                            class="w-full text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            style="background-color: #185166;"
                        >
                            Send Message
                            <span class="ml-2">→</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Quick Quote CTA -->
    <section class="section-padding" style="background: linear-gradient(135deg, #2A6F7F 0%, #3A8191 50%, #2A6F7F 100%);">
        <div class="section-container">
            <div class="max-w-4xl mx-auto text-center text-white">
                <h2 class="text-4xl lg:text-5xl font-bold font-heading mb-6">
                    Need A Quick Quote?
                </h2>
                <p class="text-xl mb-8">
                    Get an instant online quote in just 60 seconds
                </p>
                <a 
                    href="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" 
                    class="inline-flex items-center gap-3 bg-white text-lg px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    style="color: #185166;"
                >
                    <span>Get Instant Quote</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                    </svg>
                </a>
            </div>
        </div>
    </section>

</main>

<?php get_footer(); ?>
