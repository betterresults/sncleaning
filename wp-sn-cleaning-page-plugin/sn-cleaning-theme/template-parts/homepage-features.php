<!-- Features Section - Exact from HomepageFeaturesSection.tsx -->
<section class="section-padding" style="background: linear-gradient(135deg, #185166 0%, #134555 50%, #185166 100%);">
  <div class="section-container">
    <div class="text-center mb-16">
      <div class="inline-block bg-primary/20 text-primary px-6 py-3 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm border border-primary/30">
        WHY WE'RE DIFFERENT
      </div>
      <h2 class="text-4xl lg:text-5xl font-bold font-heading text-white leading-tight mb-6">
        Features That Make Us
        <span class="text-primary block">The Professional Choice</span>
      </h2>
      <p class="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
        We've built our service around what matters most to you - convenience, quality, 
        and peace of mind. Here's what sets us apart from the competition.
      </p>
    </div>

    <!-- Features Grid - 3x3 -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      <?php
      $features = [
        ['icon' => 'zap', 'title' => 'Same Day Emergency Cleaning', 'short' => 'Available 7 days a week', 'full' => 'Need urgent cleaning? We offer same-day emergency services to handle any cleaning crisis. Professional equipment and experienced team ready when you need us most.'],
        ['icon' => 'clock', 'title' => 'Flexible Scheduling', 'short' => 'Your time, your choice', 'full' => 'Book cleaning services that fit your schedule. Early morning, evening, weekend, and holiday slots available. Change or reschedule appointments easily through our booking system.'],
        ['icon' => 'headphones', 'title' => '24/7 Customer Support', 'short' => 'Always here for you', 'full' => 'Questions or concerns? Our customer support team is available around the clock to help you. Call, text, or message us anytime for quick response.'],
        ['icon' => 'shield', 'title' => 'Satisfaction Guarantee', 'short' => '100% satisfaction promise', 'full' => 'Not happy with the service? We\'ll come back and make it right at no additional cost. Your satisfaction is our top priority with our guarantee.'],
        ['icon' => 'users', 'title' => 'Dedicated Team Assignment', 'short' => 'Consistent quality', 'full' => 'Get the same professional cleaning team every visit for consistent, personalized service. Build relationships with trusted cleaners who know your preferences.'],
        ['icon' => 'smartphone', 'title' => 'Online Customer Portal', 'short' => '24/7 online access', 'full' => 'Manage your bookings, track cleaning progress, and communicate with your team through our portal. Easy online management of all your cleaning services.'],
        ['icon' => 'calendar', 'title' => 'Easy Rebooking', 'short' => 'One-click rebooking', 'full' => 'Love your service? Rebook your favorite cleaner with just one click through your customer portal. Quick and easy repeat bookings for regular customers.'],
        ['icon' => 'star', 'title' => 'Quality Assurance', 'short' => 'Consistently excellent', 'full' => 'Every cleaning is quality-checked and rated to ensure we maintain our high standards. Regular training and performance monitoring for exceptional results.'],
        ['icon' => 'check-circle', 'title' => 'Licensed & Insured', 'short' => 'Fully protected service', 'full' => 'All our cleaners are fully licensed and insured for your peace of mind. Comprehensive coverage protects your property and gives you confidence in our service.']
      ];
      
      $icon_map = [
        'zap' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>',
        'clock' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        'headphones' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>',
        'shield' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
        'users' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>',
        'smartphone' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>',
        'calendar' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>',
        'star' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>',
        'check-circle' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'
      ];
      
      foreach ($features as $f):
      ?>
        <div class="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer">
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <?php echo $icon_map[$f['icon']]; ?>
              </svg>
            </div>
            
            <div class="space-y-2">
              <h4 class="text-xl font-bold font-heading text-white group-hover:text-primary transition-colors">
                <?php echo $f['title']; ?>
              </h4>
              
              <!-- Short description - always visible -->
              <p class="text-primary font-medium text-sm">
                <?php echo $f['short']; ?>
              </p>
              
              <!-- Full description - visible on hover -->
              <div class="overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-32">
                <p class="text-slate-300 text-sm leading-relaxed pt-2">
                  <?php echo $f['full']; ?>
                </p>
              </div>
            </div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>

    <!-- Stats Section -->
    <div class="bg-white/5 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/10 shadow-xl">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        <div class="space-y-2">
          <div class="text-4xl font-bold text-primary">98%</div>
          <div class="text-slate-300 font-medium">Customer Retention Rate</div>
        </div>
        <div class="space-y-2">
          <div class="text-4xl font-bold text-primary">15min</div>
          <div class="text-slate-300 font-medium">Average Response Time</div>
        </div>
        <div class="space-y-2">
          <div class="text-4xl font-bold text-primary">50K+</div>
          <div class="text-slate-300 font-medium">Successful Cleanings</div>
        </div>
        <div class="space-y-2">
          <div class="text-4xl font-bold text-primary">24/7</div>
          <div class="text-slate-300 font-medium">Support Available</div>
        </div>
      </div>
    </div>
  </div>
</section>
