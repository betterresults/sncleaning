<!-- Service Types Section -->
<section class="section-padding bg-gradient-to-b from-muted/30 to-background">
  <div class="section-container">
    <!-- Residential Services -->
    <div class="mb-20">
      <div class="text-center mb-16">
        <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
          Residential Cleaning Services
        </h2>
        <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
          Professional home cleaning solutions with real people who care about your space
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <?php
        $residential = [
          ['img' => 'end-of-tenancy-cleaning.jpg', 'title' => 'End of Tenancy', 'desc' => 'Complete move-out cleaning to get your deposit back with professional standards and equipment.'],
          ['img' => 'after-builders-cleaning.jpg', 'title' => 'After Builders', 'desc' => 'Post-construction cleanup and dust removal including paint splatter cleaning and surface restoration.'],
          ['img' => 'domestic-cleaning.jpg', 'title' => 'Domestic Cleaning', 'desc' => 'Regular weekly, fortnightly or monthly home cleaning with flexible scheduling and consistent quality.'],
          ['img' => 'airbnb-cleaning.jpg', 'title' => 'Airbnb Cleaning', 'desc' => 'Turnaround cleaning for short-term rentals with quick service and guest-ready standards.'],
          ['img' => 'domestic-cleaning.jpg', 'title' => 'Deep House Cleaning', 'desc' => 'Comprehensive one-time deep cleaning service covering every corner and inside appliances.'],
          ['img' => 'carpet-cleaning.jpg', 'title' => 'Carpet Cleaning', 'desc' => 'Professional carpet and upholstery cleaning with steam cleaning and fast drying technology.']
        ];
        foreach ($residential as $service): ?>
          <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div class="relative h-48 overflow-hidden">
              <img 
                src="<?php echo get_template_directory_uri(); ?>/assets/images/<?php echo $service['img']; ?>" 
                alt="<?php echo $service['title']; ?> cleaning service"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-6 space-y-4">
              <h3 class="text-2xl font-bold text-foreground group-hover:text-primary transition-colors"><?php echo $service['title']; ?></h3>
              <p class="text-muted-foreground leading-relaxed"><?php echo $service['desc']; ?></p>
              <button class="btn-outline w-full mt-6 group-hover:bg-primary group-hover:text-white transition-colors">
                Learn More
                <svg class="w-4 h-4 ml-2 inline-block group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </button>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- Commercial Services -->
    <div>
      <div class="text-center mb-16">
        <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
          Commercial Cleaning Services
        </h2>
        <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
          Professional business cleaning with experienced teams you can trust
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <?php
        $commercial = [
          ['img' => 'office-cleaning.jpg', 'title' => 'Office Cleaning', 'desc' => 'Professional office maintenance and sanitization with daily or weekly service options.'],
          ['img' => 'office-cleaning.jpg', 'title' => 'School Cleaning', 'desc' => 'Educational facility cleaning with child-safe products and classroom sanitization.'],
          ['img' => 'office-cleaning.jpg', 'title' => 'Nursery Cleaning', 'desc' => 'Specialized cleaning for childcare facilities using only non-toxic products.'],
          ['img' => 'office-cleaning.jpg', 'title' => 'Retail Cleaning', 'desc' => 'Specialized cleaning for retail environments with customer-friendly hours.']
        ];
        foreach ($commercial as $service): ?>
          <div class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div class="relative h-48 overflow-hidden">
              <img 
                src="<?php echo get_template_directory_uri(); ?>/assets/images/<?php echo $service['img']; ?>" 
                alt="<?php echo $service['title']; ?> cleaning service"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-6 space-y-4">
              <h3 class="text-xl font-bold text-foreground group-hover:text-primary transition-colors"><?php echo $service['title']; ?></h3>
              <p class="text-muted-foreground text-sm leading-relaxed"><?php echo $service['desc']; ?></p>
              <button class="btn-primary w-full mt-4">
                Get Quote
                <svg class="w-4 h-4 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </button>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</section>
