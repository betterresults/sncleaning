<!-- Service Areas Section - Exact from EnhancedServiceAreasSection.tsx -->
<section class="section-padding bg-gradient-surface">
  <div class="section-container">
    <div class="text-center mb-16">
      <h2 class="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
        Service Areas Across <span class="text-primary">London & Essex</span>
      </h2>
      <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
        Professional cleaning services covering Greater London and Essex regions with fast response times
      </p>
    </div>

    <div class="max-w-6xl mx-auto">
      <!-- Mobile Layout - Stacked Cards -->
      <div class="block lg:hidden space-y-6">
        <div class="bg-white rounded-2xl p-6 shadow-lg border">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
            <h3 class="text-xl font-bold text-foreground">London Coverage</h3>
          </div>
          <p class="text-lg font-semibold text-primary mb-2">All London areas within M25</p>
          <p class="text-sm text-muted-foreground">Complete coverage of Greater London</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lg border">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-4 h-4 bg-accent rounded-full animate-pulse" style="animation-delay: 500ms;"></div>
            <h3 class="text-xl font-bold text-foreground">Essex Coverage</h3>
          </div>
          <p class="text-lg font-semibold text-accent mb-2">Essex areas</p>
          <p class="text-sm text-muted-foreground">Major towns and surrounding areas</p>
        </div>
      </div>

      <!-- Desktop Layout - Map with Overlaid Cards -->
      <div class="hidden lg:block relative bg-white rounded-3xl p-8 shadow-lg overflow-hidden">
        <div class="relative h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl overflow-hidden border-2 border-slate-200">
          <div class="absolute inset-0 opacity-20">
            <svg class="w-full h-full" viewBox="0 0 400 300">
              <defs>
                <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#94a3b8" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <g opacity="0.3">
                <circle cx="120" cy="150" r="45" fill="#18A5A5" opacity="0.2"/>
                <circle cx="130" cy="140" r="35" fill="#18A5A5" opacity="0.3"/>
                <circle cx="110" cy="160" r="25" fill="#18A5A5" opacity="0.4"/>
                <ellipse cx="280" cy="120" rx="40" ry="50" fill="#185166" opacity="0.2"/>
                <ellipse cx="290" cy="110" rx="30" ry="35" fill="#185166" opacity="0.3"/>
                <ellipse cx="270" cy="130" rx="20" ry="25" fill="#185166" opacity="0.4"/>
              </g>
              <path d="M 160 150 Q 200 140 240 120" stroke="#94a3b8" stroke-width="3" fill="none" opacity="0.4"/>
              <path d="M 140 170 Q 180 160 220 140" stroke="#94a3b8" stroke-width="2" fill="none" opacity="0.3"/>
            </svg>
          </div>
          
          <div class="absolute left-8 top-1/2 transform -translate-y-1/2">
            <div class="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border max-w-xs">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                <h3 class="text-xl font-bold text-foreground">London Coverage</h3>
              </div>
              <p class="text-lg font-semibold text-primary mb-2">All London areas within M25</p>
              <p class="text-sm text-muted-foreground">Complete coverage of Greater London</p>
            </div>
          </div>

          <div class="absolute right-8 top-1/3 transform -translate-y-1/2">
            <div class="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border max-w-xs">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-4 h-4 bg-accent rounded-full animate-pulse" style="animation-delay: 500ms;"></div>
                <h3 class="text-xl font-bold text-foreground">Essex Coverage</h3>
              </div>
              <p class="text-lg font-semibold text-accent mb-2">Essex areas</p>
              <p class="text-sm text-muted-foreground">Major towns and surrounding areas</p>
            </div>
          </div>

          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <div class="w-20 h-0.5 bg-gradient-to-r from-primary to-accent animate-pulse" style="animation-delay: 300ms;"></div>
              <div class="w-3 h-3 bg-accent rounded-full animate-pulse" style="animation-delay: 500ms;"></div>
            </div>
          </div>

          <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md animate-float">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm font-medium">Fast Response</span>
            </div>
          </div>
          
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md animate-float" style="animation-delay: 1s;">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm font-medium">Guaranteed</span>
            </div>
          </div>
          
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md animate-float" style="animation-delay: 500ms;">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span class="text-sm font-medium">Full Coverage</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-16">
      <div class="inline-flex items-center gap-4 bg-white px-8 py-4 rounded-2xl shadow-md">
        <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-lg font-semibold text-foreground">
          Same-day quotes • 24/7 availability • Fully insured
        </span>
      </div>
    </div>
  </div>
</section>
