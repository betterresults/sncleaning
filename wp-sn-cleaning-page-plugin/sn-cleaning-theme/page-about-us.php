<?php
/**
 * About Us Page Template (Slug: about-us)
 * 
 * @package SN_Cleaning
 */

get_header();
?>

<!-- Hero Section -->
<section class="relative section-padding pt-32 pb-24 overflow-hidden">
  <div class="absolute inset-0 z-0">
    <img 
      src="<?php echo get_template_directory_uri(); ?>/assets/images/hero-kitchen.jpg" 
      alt="Professional cleaning services"
      class="w-full h-full object-cover"
    />
    <div class="absolute inset-0 overlay-dark-br"></div>
  </div>
  
  <div class="section-container relative z-10">
    <div class="max-w-4xl mx-auto text-center space-y-6">
      <h1 class="text-5xl lg:text-7xl font-bold font-heading text-white leading-tight animate-fade-in">
        About <span class="text-primary">SN Cleaning</span>
      </h1>
      <p class="text-xl lg:text-2xl text-white/90 leading-relaxed">
        London's trusted professional cleaning service – reliable, thorough, and committed to excellence.
      </p>
    </div>
  </div>
</section>

<!-- Who We Are Section -->
<section class="section-padding bg-background">
  <div class="section-container">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div class="space-y-6 animate-fade-in">
        <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
          Who <span class="text-primary">We Are</span>
        </h2>
        
        <div class="space-y-4 text-lg text-muted-foreground leading-relaxed">
          <p>
            SN Cleaning was founded in 2016 with a simple mission: to provide London residents with cleaning services they can genuinely trust. What started as a small team of dedicated professionals has grown into a company serving over 8,000 satisfied customers across Greater London.
          </p>
          
          <p>
            <strong class="text-foreground">We're a family-run business</strong> that treats every home as if it were our own. Our team consists of 50+ professionally trained cleaners, each carefully selected and thoroughly vetted to ensure they meet our exacting standards.
          </p>

          <p>
            Every single cleaner undergoes comprehensive background checks, extensive training in professional cleaning techniques, and certification in the safe use of our eco-friendly products. We don't just hire cleaners – we invest in building a team of trusted professionals.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 gap-4 pt-4">
          <?php
          $certifications = [
            ['text' => 'Fully Insured & Bonded'],
            ['text' => 'Background Checked Staff'],
            ['text' => 'Eco-Friendly Certified'],
            ['text' => 'Industry Accredited']
          ];
          foreach ($certifications as $cert): ?>
            <div class="flex items-center gap-3 p-4 bg-gradient-surface rounded-lg">
              <svg class="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span class="text-sm font-semibold text-foreground"><?php echo $cert['text']; ?></span>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <div class="relative animate-fade-in">
        <div class="relative rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src="<?php echo get_template_directory_uri(); ?>/assets/images/professional-cleaner.jpg" 
            alt="Professional SN Cleaning team member"
            class="w-full h-[500px] object-cover"
          />
          <div class="absolute inset-0 overlay-to-top"></div>
          <div class="absolute bottom-8 left-8 right-8 text-white">
            <p class="text-2xl font-bold mb-2">50+ Trained Professionals</p>
            <p class="text-lg opacity-90">Every cleaner is background-checked and certified</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- How We Train Our Team -->
<section class="section-padding bg-gradient-surface">
  <div class="section-container">
    <div class="max-w-3xl mx-auto text-center mb-16 space-y-4">
      <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
        How We Train <span class="text-primary">Our Cleaners</span>
      </h2>
      <p class="text-xl text-muted-foreground">
        We don't just hire cleaners – we develop trusted professionals through rigorous training
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
      <?php
      $training = [
        ['title' => 'Comprehensive Background Checks', 'desc' => 'Every candidate undergoes thorough criminal background checks, identity verification, and reference checks before joining our team. Your safety and security are non-negotiable.'],
        ['title' => '3-Week Professional Training', 'desc' => 'New team members complete an intensive 3-week training program covering professional cleaning techniques, customer service, safety protocols, and proper use of equipment and eco-friendly products.'],
        ['title' => 'Fully Insured & Bonded', 'desc' => 'All our cleaners are covered by comprehensive insurance, including public liability and employer\'s liability. You\'re protected, and so are they.'],
        ['title' => 'Ongoing Quality Assessments', 'desc' => 'Our team undergoes regular performance reviews, customer feedback assessments, and continuous training to maintain our high standards and stay updated on best practices.']
      ];
      foreach ($training as $item): ?>
        <div class="bg-background p-8 rounded-2xl space-y-4">
          <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 class="text-2xl font-bold text-foreground"><?php echo $item['title']; ?></h3>
          <p class="text-lg text-muted-foreground leading-relaxed"><?php echo $item['desc']; ?></p>
        </div>
      <?php endforeach; ?>
    </div>

    <div class="max-w-4xl mx-auto bg-background rounded-2xl p-8 border-2 border-primary/20">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div class="space-y-4">
          <h3 class="text-3xl font-bold text-foreground">Why This Matters to You</h3>
          <p class="text-lg text-muted-foreground leading-relaxed">
            When you book SN Cleaning, you're not getting random contractors. You're getting professionally trained, thoroughly vetted cleaners who understand exactly what they're doing. This means consistent quality, trustworthy service, and peace of mind every single time.
          </p>
        </div>
        <div class="space-y-3">
          <?php
          $points = [
            'No subcontractors – only our trained team',
            'Same high standards on every visit',
            'Professional-grade equipment & products',
            'Respectful treatment of your home',
            'Accountable, trackable service'
          ];
          foreach ($points as $point): ?>
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span class="text-foreground font-medium"><?php echo $point; ?></span>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Why We're Different -->
<section class="section-padding bg-background">
  <div class="section-container">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div class="relative animate-fade-in order-2 lg:order-1">
        <div class="relative rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src="<?php echo get_template_directory_uri(); ?>/assets/images/hero-kitchen.jpg" 
            alt="Spotlessly cleaned kitchen by SN Cleaning"
            class="w-full h-[500px] object-cover"
          />
        </div>
      </div>

      <div class="space-y-6 animate-fade-in order-1 lg:order-2">
        <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
          Why We're <span class="text-primary">Different</span>
        </h2>
        
        <div class="space-y-4 text-lg text-muted-foreground leading-relaxed">
          <p>Most cleaning companies make big promises. We focus on delivering results you can see and trust.</p>
          
          <div class="space-y-4">
            <?php
            $differences = [
              ['title' => 'We Show Up On Time', 'desc' => 'Your time is valuable. We respect that with punctual, reliable service.'],
              ['title' => 'Eco-Friendly & Safe', 'desc' => 'Professional results without harsh chemicals. Safe for your family, pets, and the planet.'],
              ['title' => 'Deposit Return Guarantee', 'desc' => 'Our end-of-tenancy cleaning meets landlord and agent standards every time.'],
              ['title' => 'We Actually Care', 'desc' => 'This isn\'t just a job for us. We take pride in helping you live in a cleaner, healthier space.']
            ];
            foreach ($differences as $diff): ?>
              <div class="flex items-start gap-4 p-4 bg-gradient-surface rounded-xl">
                <svg class="w-6 h-6 text-primary flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <div>
                  <h4 class="font-bold text-foreground mb-1"><?php echo $diff['title']; ?></h4>
                  <p class="text-muted-foreground"><?php echo $diff['desc']; ?></p>
                </div>
              </div>
            <?php endforeach; ?>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Our Expertise -->
<section class="section-padding bg-gradient-surface">
  <div class="section-container">
    <div class="max-w-3xl mx-auto text-center mb-16 space-y-4">
      <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
        Our <span class="text-primary">Expertise</span>
      </h2>
      <p class="text-xl text-muted-foreground">
        Specialized cleaning services backed by years of experience
      </p>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <?php
      $expertise = [
        ['title' => 'End of Tenancy Specialists', 'desc' => '99.8% deposit return rate with comprehensive checklists approved by major letting agents', 'img' => 'hero-kitchen.jpg'],
        ['title' => 'Domestic Cleaning Excellence', 'desc' => 'Regular and one-off cleaning services tailored to your lifestyle and schedule', 'img' => 'domestic-cleaning.jpg'],
        ['title' => 'Deep Cleaning Experts', 'desc' => 'Professional-grade equipment and eco-friendly products for thorough sanitization', 'img' => 'carpet-cleaning.jpg']
      ];
      foreach ($expertise as $exp): ?>
        <div class="bg-background rounded-2xl overflow-hidden hover:shadow-xl transition-all hover-scale group">
          <div class="relative h-64 overflow-hidden">
            <img 
              src="<?php echo get_template_directory_uri(); ?>/assets/images/<?php echo $exp['img']; ?>" 
              alt="<?php echo $exp['title']; ?>"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div class="absolute inset-0" style="background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
            <div class="absolute bottom-4 left-4 right-4">
              <div class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
            </div>
          </div>
          <div class="p-6 space-y-3">
            <h3 class="text-2xl font-bold text-foreground"><?php echo $exp['title']; ?></h3>
            <p class="text-muted-foreground leading-relaxed"><?php echo $exp['desc']; ?></p>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- Our Journey Timeline -->
<section class="section-padding bg-background">
  <div class="section-container">
    <div class="max-w-3xl mx-auto text-center mb-16 space-y-4">
      <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
        Our <span class="text-primary">Journey</span>
      </h2>
      <p class="text-xl text-muted-foreground">
        From a small startup to London's most trusted cleaning service
      </p>
    </div>

    <div class="max-w-4xl mx-auto">
      <div class="space-y-8">
        <?php
        $timeline = [
          ['year' => '2016', 'milestone' => 'Founded in London', 'desc' => 'Started with a vision to transform cleaning services'],
          ['year' => '2018', 'milestone' => '1,000+ Happy Customers', 'desc' => 'Reached first major customer milestone'],
          ['year' => '2020', 'milestone' => 'Expanded Service Range', 'desc' => 'Added specialized cleaning services'],
          ['year' => '2023', 'milestone' => '8,000+ Satisfied Clients', 'desc' => 'Became one of London\'s most trusted names']
        ];
        foreach ($timeline as $item): ?>
          <div class="flex gap-8 items-start group">
            <div class="flex-shrink-0 w-32 text-right">
              <div class="inline-block px-4 py-2 bg-primary/10 rounded-lg">
                <span class="text-2xl font-bold text-primary"><?php echo $item['year']; ?></span>
              </div>
            </div>
            <div class="flex-shrink-0 relative">
              <div class="w-4 h-4 bg-primary rounded-full"></div>
              <div class="absolute top-4 left-1/2 w-0.5 h-full bg-primary/20 -translate-x-1/2"></div>
            </div>
            <div class="flex-1 pb-8">
              <h3 class="text-2xl font-bold text-foreground mb-2"><?php echo $item['milestone']; ?></h3>
              <p class="text-lg text-muted-foreground leading-relaxed"><?php echo $item['desc']; ?></p>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</section>

<!-- Stats Section -->
<section class="section-padding bg-gradient-surface">
  <div class="section-container">
    <div class="max-w-5xl mx-auto">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        <?php
        $stats = [
          ['number' => '8,000+', 'label' => 'Happy Customers', 'sublabel' => 'Across Greater London'],
          ['number' => '99.8%', 'label' => 'Deposit Returns', 'sublabel' => 'For end of tenancy'],
          ['number' => '50+', 'label' => 'Expert Cleaners', 'sublabel' => 'Fully trained & vetted'],
          ['number' => '8+', 'label' => 'Years Experience', 'sublabel' => 'Trusted since 2016']
        ];
        foreach ($stats as $stat): ?>
          <div class="p-6 bg-background rounded-2xl">
            <svg class="w-12 h-12 text-primary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <div class="text-4xl font-bold text-primary mb-2"><?php echo $stat['number']; ?></div>
            <div class="text-lg font-semibold text-foreground mb-1"><?php echo $stat['label']; ?></div>
            <div class="text-sm text-muted-foreground"><?php echo $stat['sublabel']; ?></div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</section>

<!-- Call to Action -->
<section class="section-padding bg-gradient-to-br from-primary/10 to-accent/10">
  <div class="section-container">
    <div class="max-w-4xl mx-auto text-center space-y-8">
      <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground">
        Ready to Experience <span class="text-primary">The SN Cleaning Difference?</span>
      </h2>
      <p class="text-xl text-muted-foreground leading-relaxed">
        Join thousands of satisfied customers across London who trust us with their cleaning needs.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a href="tel:02038355033" class="btn-hero text-xl px-8 py-4 rounded-2xl inline-flex items-center gap-2">
          Get Your Free Quote Today
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </a>
      </div>
    </div>
  </div>
</section>

<?php get_footer(); ?>