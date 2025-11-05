<footer style="background: hsl(203 55% 25%); color: hsl(0 0% 100%); padding: 5rem 0;">
    <div style="max-width: 80rem; margin: 0 auto; padding: 0 1.5rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 3rem;">
            <!-- Company Info -->
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                <div style="display: flex; align-items: center;">
                    <?php if (has_custom_logo()) : 
                        the_custom_logo();
                    else : ?>
                        <img 
                            src="<?php echo get_template_directory_uri(); ?>/assets/images/sn-cleaning-logo-new.png" 
                            alt="SN Cleaning Services" 
                            style="height: 5rem; width: auto;"
                        />
                    <?php endif; ?>
                </div>
                <p style="font-size: 1rem; line-height: 1.7; color: hsl(0 0% 100% / 0.85); margin: 0;">
                    Professional cleaning services across London and Essex. We guarantee exceptional results with our comprehensive cleaning solutions for residential and commercial properties.
                </p>
                <div style="display: flex; gap: 1rem;">
                    <a 
                        href="tel:+442038355033" 
                        style="display: flex; align-items: center; justify-content: center; width: 3.5rem; height: 3.5rem; background: hsl(0 0% 100% / 0.08); color: hsl(180 63% 56%); border-radius: 0.75rem; text-decoration: none; transition: all 0.3s ease; border: 1px solid hsl(0 0% 100% / 0.15); box-shadow: 0 4px 12px -4px rgba(0,0,0,.35);"
                        aria-label="Call us"
                        onmouseover="this.style.background='hsl(180 63% 36% / 0.25)'; this.style.color='hsl(0 0% 100%)'; this.style.transform='scale(1.08)';"
                        onmouseout="this.style.background='hsl(0 0% 100% / 0.08)'; this.style.color='hsl(180 63% 56%)'; this.style.transform='scale(1)';"
                    >
                        <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    </a>
                    <a 
                        href="https://wa.me/442038355033" 
                        target="_blank"
                        rel="noopener noreferrer"
                        style="display: flex; align-items: center; justify-content: center; width: 3.5rem; height: 3.5rem; background: hsl(0 0% 100% / 0.08); color: hsl(180 63% 56%); border-radius: 0.75rem; text-decoration: none; transition: all 0.3s ease; border: 1px solid hsl(0 0% 100% / 0.15); box-shadow: 0 4px 12px -4px rgba(0,0,0,.35);"
                        aria-label="WhatsApp us"
                        onmouseover="this.style.background='hsl(180 63% 36% / 0.25)'; this.style.color='hsl(0 0% 100%)'; this.style.transform='scale(1.08)';"
                        onmouseout="this.style.background='hsl(0 0% 100% / 0.08)'; this.style.color='hsl(180 63% 56%)'; this.style.transform='scale(1)';"
                    >
                        <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    </a>
                    <a 
                        href="mailto:info@sncleaningservices.co.uk" 
                        style="display: flex; align-items: center; justify-content: center; width: 3.5rem; height: 3.5rem; background: hsl(0 0% 100% / 0.08); color: hsl(180 63% 56%); border-radius: 0.75rem; text-decoration: none; transition: all 0.3s ease; border: 1px solid hsl(0 0% 100% / 0.15); box-shadow: 0 4px 12px -4px rgba(0,0,0,.35);"
                        aria-label="Email us"
                        onmouseover="this.style.background='hsl(180 63% 36% / 0.25)'; this.style.color='hsl(0 0% 100%)'; this.style.transform='scale(1.08)';"
                        onmouseout="this.style.background='hsl(0 0% 100% / 0.08)'; this.style.color='hsl(180 63% 56%)'; this.style.transform='scale(1)';"
                    >
                        <svg style="width: 1.5rem; height: 1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l4 4 4-4m0 6l4-4 4 4m-6 2h6a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h6z"></path></svg>
                    </a>
                </div>
            </div>

            <!-- Quick Links -->
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: hsl(0 0% 100%); margin: 0;">Quick Links</h3>
                <nav style="display: flex; flex-direction: column; gap: 1rem;">
                    <a href="<?php echo esc_url(home_url('/')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">Home</a>
                    <a href="<?php echo esc_url(home_url('/about')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">About Us</a>
                    <a href="<?php echo esc_url(home_url('/faqs')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">FAQs</a>
                    <a href="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">Get Quote</a>
                    <a href="<?php echo esc_url(home_url('/contact')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">Contact</a>
                </nav>
            </div>

            <!-- Services -->
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: hsl(0 0% 100%); margin: 0;">Our Services</h3>
                <nav style="display: flex; flex-direction: column; gap: 1rem;">
                    <a href="<?php echo esc_url(home_url('/services/end-of-tenancy')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">End of Tenancy Cleaning</a>
                    <a href="<?php echo esc_url(home_url('/services/domestic')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">Domestic Cleaning</a>
                    <a href="<?php echo esc_url(home_url('/services/deep-cleaning')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">Deep Cleaning</a>
                    <a href="<?php echo esc_url(home_url('/services/carpet')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">Carpet Cleaning</a>
                    <a href="<?php echo esc_url(home_url('/services/oven-cleaning')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">Oven Cleaning</a>
                    <a href="<?php echo esc_url(home_url('/services/commercial')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.95); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.95)'">Commercial Cleaning</a>
                </nav>
            </div>

            <!-- Contact Info -->
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: hsl(0 0% 100%); margin: 0;">Get In Touch</h3>
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div style="display: flex; align-items: flex-start; gap: 1rem;">
                        <div style="margin-top: 0.25rem; padding: 0.75rem; border-radius: 0.75rem; background: hsl(0 0% 100% / 0.08); box-shadow: 0 4px 12px -4px rgba(0,0,0,.35); border: 1px solid hsl(0 0% 100% / 0.15);">
                            <svg style="width: 1.5rem; height: 1.5rem; color: hsl(180 63% 56%);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 1rem; color: hsl(0 0% 100%); margin-bottom: 0.25rem;">Phone</div>
                            <a href="tel:+442038355033" style="font-size: 1rem; color: hsl(0 0% 100% / 0.9); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.9)'">020 3835 5033</a>
                        </div>
                    </div>

                    <div style="display: flex; align-items: flex-start; gap: 1rem;">
                        <div style="margin-top: 0.25rem; padding: 0.75rem; border-radius: 0.75rem; background: hsl(0 0% 100% / 0.08); box-shadow: 0 4px 12px -4px rgba(0,0,0,.35); border: 1px solid hsl(0 0% 100% / 0.15);">
                            <svg style="width: 1.5rem; height: 1.5rem; color: hsl(180 63% 56%);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l4 4 4-4m0 6l4-4 4 4m-6 2h6a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h6z"></path></svg>
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 1rem; color: hsl(0 0% 100%); margin-bottom: 0.25rem;">Email</div>
                            <a href="mailto:info@sncleaningservices.co.uk" style="font-size: 1rem; color: hsl(0 0% 100% / 0.9); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.9)'">info@sncleaningservices.co.uk</a>
                        </div>
                    </div>

                    <div style="display: flex; align-items: flex-start; gap: 1rem;">
                        <div style="margin-top: 0.25rem; padding: 0.75rem; border-radius: 0.75rem; background: hsl(0 0% 100% / 0.08); box-shadow: 0 4px 12px -4px rgba(0,0,0,.35); border: 1px solid hsl(0 0% 100% / 0.15);">
                            <svg style="width: 1.5rem; height: 1.5rem; color: hsl(180 63% 56%);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 1rem; color: hsl(0 0% 100%); margin-bottom: 0.25rem;">Service Area</div>
                            <div style="font-size: 1rem; color: hsl(0 0% 100% / 0.9);">London & Essex</div>
                        </div>
                    </div>

                    <div style="padding-top: 1.5rem;">
                        <a href="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" 
                           style="display: block; width: 100%; text-align: center; background: linear-gradient(135deg, hsl(180 63% 36%), hsl(180 45% 40%)); color: hsl(0 0% 100%); padding: 1rem 2rem; border-radius: 0.75rem; font-weight: 800; font-size: 1.125rem; text-decoration: none; transition: all 0.3s ease; box-shadow: 0 10px 25px -5px rgba(24, 165, 165, 0.35);"
                           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 20px 40px -10px rgba(24, 165, 165, 0.45)';"
                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 25px -5px rgba(24, 165, 165, 0.35)';">
                            Get Free Quote
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Bar -->
        <div style="margin-top: 4rem; padding-top: 2.5rem; border-top: 1px solid hsl(0 0% 100% / 0.15);">
            <div style="display: flex; flex-direction: column; gap: 1.5rem; align-items: center; text-align: center;">
                <div style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.9);">
                    Copyright © 2025 SN Core LTD. All Rights Reserved. Company Number 15912581
                </div>
                <div style="display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center;">
                    <a href="<?php echo esc_url(home_url('/privacy')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.9); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.9)'">Privacy Policy</a>
                    <a href="<?php echo esc_url(home_url('/terms')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.9); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.9)'">Terms of Service</a>
                    <a href="<?php echo esc_url(home_url('/cookies')); ?>" style="font-size: 1rem; font-weight: 600; color: hsl(0 0% 100% / 0.9); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='hsl(180 63% 56%)'" onmouseout="this.style.color='hsl(0 0% 100% / 0.9)'">Cookie Policy</a>
                </div>
            </div>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
