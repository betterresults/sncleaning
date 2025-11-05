<!-- FAQ Section - Exact from FAQSection.tsx -->
<section class="section-padding bg-gradient-surface">
  <div class="section-container">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-4">
        Frequently Asked Questions
      </h2>
      <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
        Got questions? We've got answers. Here are the most common questions about our professional cleaning services.
      </p>
    </div>
    
    <div class="max-w-3xl mx-auto space-y-4">
      <?php
      $faqs = [
        ['q' => 'Which areas of London and Essex do you cover?', 'a' => 'Our service area is extensive, covering all London boroughs within the M25 and a wide range of towns across Essex. Our dedicated local teams are positioned throughout the capital to provide a fast and reliable service, whether you are in North, South, East, West, or Central London. Essentially, if your property is within the M25 motorway or our key Essex regions, we have you covered. For a detailed list of postcodes, please see our Areas We Serve page.'],
        ['q' => 'What\'s included in a standard professional cleaning service?', 'a' => 'Our standard cleaning services (such as Domestic Cleaning and Deep Cleaning) are designed to be thorough and comprehensive. While every home is unique, our service always includes a detailed clean of all rooms. We don\'t just tidy; we deep clean. This includes: Kitchen - wiping all surfaces and cabinet fronts, cleaning the hob and extractor fan, cleaning the microwave inside and out, scrubbing the sink and taps, and vacuuming/mopping the floor. Bathrooms - fully sanitising the toilet, shower, and bath, descaling taps and showerheads, cleaning all mirrors and glass, and washing the floor. Bedrooms & Living Areas - dusting all surfaces (including skirting boards and light fittings), polishing any wooden furniture, cleaning internal windows, and thoroughly vacuuming all carpets and mopping hard floors.'],
        ['q' => 'Are your cleaners insured, background-checked, and employed by you?', 'a' => 'Yes, and we believe this is one of the most important factors in choosing a cleaning service. For your peace of mind, every member of our team is a direct employee, not a temporary contractor. They each undergo a rigorous vetting process which includes identity verification, background checks, and reference checks. Furthermore, we are fully covered by comprehensive public liability insurance, protecting your home and belongings against any accidental damage.'],
        ['q' => 'Do I need to provide any cleaning equipment or supplies?', 'a' => 'No, you don\'t need to provide a thing. Our professional cleaners arrive at your property fully equipped with all the necessary high-quality equipment, from professional-grade vacuum cleaners to specialised tools. We also bring our own range of effective, safe, and eco-friendly cleaning products to ensure a perfect finish every time.'],
        ['q' => 'How does your pricing work? Is it a fixed price or an hourly rate?', 'a' => 'We believe in transparent and fair pricing with no surprises. For our specialised services like End of Tenancy Cleaning and After Builders Cleaning, we provide a fixed, all-inclusive quote based on the size and condition of your property. For our regular Domestic Cleaning services, we can arrange a consistent weekly or bi-weekly rate. You will always know the full price upfront before we begin any work.'],
        ['q' => 'Can I book a recurring service, for example, weekly or fortnightly?', 'a' => 'Yes, absolutely. A large number of our clients in London and Essex rely on our recurring Domestic Cleaning services to keep their homes consistently clean and fresh. We can arrange a schedule that works for you, whether it\'s weekly, every two weeks, or monthly. Recurring clients often benefit from a preferred time slot and a dedicated cleaner who becomes familiar with their home\'s specific needs.'],
        ['q' => 'What is your satisfaction guarantee?', 'a' => 'We stand by the quality of our work with a rock-solid satisfaction guarantee. For our specialised services like End of Tenancy Cleaning, we offer a 72-hour re-clean guarantee. This means if your landlord or letting agent is unsatisfied with any aspect of the clean during the checkout inspection, we will return to the property and rectify it completely free of charge. Your satisfaction is our measure of success.'],
        ['q' => 'Do you offer specialised services beyond regular home cleaning?', 'a' => 'Yes, we do. While regular domestic cleaning is a core part of our business, we are also specialists in a range of more intensive services. This includes our guaranteed End of Tenancy Cleaning for tenants moving out, After Builders Cleaning to handle post-construction dust and debris, and detailed Commercial Cleaning for offices, schools, and nurseries. You can learn more about all of our offerings on our main Services page.']
      ];
      foreach ($faqs as $faq):
      ?>
        <details class="bg-card border border-border rounded-lg px-6 hover:shadow-lg transition-shadow duration-300">
          <summary class="text-left cursor-pointer py-6 font-semibold text-foreground flex justify-between items-center">
            <span><?php echo $faq['q']; ?></span>
            <svg class="w-5 h-5 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </summary>
          <div class="pb-6 text-muted-foreground leading-relaxed">
            <?php echo $faq['a']; ?>
          </div>
        </details>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<style>
details[open] summary svg {
  transform: rotate(180deg);
}
</style>
