<!-- Call to Action Section - Exact from CallToActionSection.tsx -->
<section class="section-padding relative overflow-hidden" style="background: linear-gradient(135deg, #2A6F7F 0%, #3A8191 50%, #2A6F7F 100%);">
  <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
  <div class="absolute inset-0">
    <div class="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-to-br from-white/20 to-primary-glow/30 rounded-full blur-xl animate-float"></div>
    <div class="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-primary-glow/40 to-white/15 rounded-full blur-lg animate-float" style="animation-delay: 1s;"></div>
    <div class="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-white/25 to-primary-glow/20 rounded-full blur-md animate-float" style="animation-delay: 500ms;"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-primary-dark/20 to-transparent"></div>
  </div>

  <div class="section-container relative z-10">
    <div class="max-w-4xl mx-auto text-center">
      <div class="mb-12">
        <h2 class="text-4xl lg:text-6xl font-bold font-heading mb-6">
          Ready for a <span class="bg-gradient-to-r from-white to-primary-glow bg-clip-text text-transparent">Spotless</span> Clean?
        </h2>
        <p class="text-xl lg:text-2xl text-white/95 max-w-3xl mx-auto leading-relaxed">
          Join thousands of satisfied customers across London & Essex. Get your instant quote today and experience the difference professional cleaning makes.
        </p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
        <?php
        $benefits = ['Free, no-obligation quotes', 'Same-day booking available', '100% satisfaction guaranteed', 'Fully insured & bonded', 'Professional team', 'Eco-friendly products'];
        foreach ($benefits as $benefit): ?>
          <div class="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl p-5 hover:bg-white/25 hover:scale-105 transition-all duration-300 border border-white/20">
            <svg class="w-5 h-5 text-primary-glow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="text-white font-medium"><?php echo $benefit; ?></span>
          </div>
        <?php endforeach; ?>
      </div>

      <div class="mb-16 flex justify-center">
        <a href="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" class="inline-flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-white via-primary-glow/10 to-white text-primary hover:from-primary-glow hover:via-white hover:to-primary-glow hover:text-primary-dark text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-3xl font-bold shadow-2xl hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transform hover:scale-110 transition-all duration-500 border-2 border-white/20 hover:border-primary-glow/50 w-full sm:w-auto max-w-md sm:max-w-none">
          <span class="text-xl sm:text-2xl font-extrabold">Get Instant Quote</span>
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </a>
      </div>

      <div class="flex flex-col sm:flex-row gap-8 justify-center items-center text-white/90">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-primary-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="font-medium">Response within 30 minutes</span>
        </div>
        <div class="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-primary-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="font-medium">No hidden fees</span>
        </div>
        <div class="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-primary-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
          <span class="font-medium">24/7 customer support</span>
        </div>
      </div>
    </div>
  </div>
</section>
