<!-- Recent Blog Posts Section - Exact from RecentBlogPostsSection.tsx -->
<section class="section-padding bg-background">
  <div class="section-container">
    <div class="text-center mb-16">
      <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
        Latest <span class="text-primary">Cleaning Tips</span> & Insights
      </h2>
      <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
        Stay updated with expert cleaning advice, industry insights, and helpful tips from our professional team
      </p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      <?php
      $posts = [
        ['title' => 'Ultimate End of Tenancy Cleaning Checklist', 'excerpt' => 'Everything you need to know to get your full deposit back. Our comprehensive guide covers every room and essential cleaning task.', 'date' => 'March 15, 2024', 'time' => '5 min read', 'cat' => 'Guides'],
        ['title' => 'Spring Cleaning Tips from Professional Cleaners', 'excerpt' => 'Transform your home with expert tips and tricks from our professional cleaning team. Make your spring cleaning efficient and thorough.', 'date' => 'March 10, 2024', 'time' => '3 min read', 'cat' => 'Tips'],
        ['title' => 'How to Choose the Right Cleaning Service', 'excerpt' => 'Key factors to consider when selecting a professional cleaning service. Learn what questions to ask and red flags to avoid.', 'date' => 'March 5, 2024', 'time' => '4 min read', 'cat' => 'Advice']
      ];
      foreach ($posts as $post): ?>
        <article class="group bg-background rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-border">
          <div class="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/5 rounded-t-3xl overflow-hidden">
            <div class="w-full h-full bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
              <div class="text-center">
                <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <span class="text-sm text-muted-foreground">Blog Image</span>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between text-sm text-muted-foreground">
              <span class="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                <?php echo $post['cat']; ?>
              </span>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span><?php echo $post['date']; ?></span>
                </div>
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span><?php echo $post['time']; ?></span>
                </div>
              </div>
            </div>

            <h3 class="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              <?php echo $post['title']; ?>
            </h3>

            <p class="text-muted-foreground leading-relaxed">
              <?php echo $post['excerpt']; ?>
            </p>

            <div class="flex items-center text-primary font-medium gap-2 group-hover:gap-3 transition-all duration-300">
              <span>Read More</span>
              <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </div>
          </div>
        </article>
      <?php endforeach; ?>
    </div>

    <div class="text-center">
      <button class="inline-flex items-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 px-8 py-3 rounded-xl font-semibold">
        View All Blog Posts
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
      </button>
    </div>
  </div>
</section>
