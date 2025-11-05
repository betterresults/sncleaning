<!-- Simple Booking Process Section - Exact from HomepageBookingSection.tsx -->
<section class="section-padding bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
  <div class="section-container">
    <div class="text-center mb-16">
      <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
        Simple Booking Process
      </h2>
      <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
        Get professional cleaning service in three easy steps. No hassle, no hidden fees.
      </p>
    </div>

    <!-- Steps Grid -->
    <div class="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
      <?php
      $steps = [
        ['icon' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>', 'title' => 'Choose Service', 'description' => 'Select from our range of professional cleaning services that fit your needs'],
        ['icon' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>', 'title' => 'Fill the Form', 'description' => 'Provide your details and preferences for a personalized cleaning experience'],
        ['icon' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>', 'title' => 'Book Online', 'description' => 'Confirm your booking and choose a convenient date and time for your service']
      ];
      foreach ($steps as $index => $step):
      ?>
        <div class="relative flex flex-col items-center text-center group">
          <div class="absolute -top-4 -left-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg z-10">
            <?php echo $index + 1; ?>
          </div>
          <div class="bg-background rounded-2xl p-8 shadow-lg border border-border hover:shadow-2xl transition-all duration-300 w-full h-full hover:-translate-y-2">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><?php echo $step['icon']; ?></svg>
            </div>
            <h3 class="text-2xl font-bold font-heading text-foreground mb-4"><?php echo esc_html($step['title']); ?></h3>
            <p class="text-muted-foreground leading-relaxed"><?php echo esc_html($step['description']); ?></p>
          </div>
          <?php if ($index < 2): ?>
            <div class="hidden md:block absolute top-1/2 -right-4 transform translate-x-1/2 -translate-y-1/2">
              <svg class="w-8 h-8 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </div>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>

    <div class="text-center">
      <a href="<?php echo esc_url(sn_get_option('booking_url', 'https://book.sncleaningservices.co.uk')); ?>" class="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
        <span>Get Quote & Book Online</span>
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      </a>
      <p class="mt-6 text-gray-600 flex items-center justify-center gap-2">
        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        </svg>
        <span class="font-semibold">Or call us: 020 1234 5678</span>
      </p>
    </div>
  </div>
</section>
