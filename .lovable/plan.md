

# Landing Page and Funnel Pages Plan

Based on the uploaded document, we need to create 3 new pages that form a marketing funnel for SN Cleaning Services.

---

## Page 1: VSL Landing Page (`/get-quote` or `/lp`)

The main landing page visitors see from ads or organic traffic.

**Sections (top to bottom):**
1. **Hero Section** - Headline: "Reliable & Consistent Cleaning In London & Essex", subheadline about in-house trained staff, supervisors, checklists, and photo reports
2. **Video Placeholder** - An empty video container/placeholder area (no actual video content - just a styled box ready for a video embed later)
3. **CTA Button** - "Get my FREE personalised quote" - scrolls to lead form or navigates to Page 2
4. **Testimonials Section** - 3 review cards with the testimonials from the document
5. **Body Section** (from pages 6-7) - "3 key reasons clients choose SN Clean" with trust copy about consistency, checklists, and photo reports
6. **Second CTA Button** - Same "Get my FREE personalised quote"

**Design:** Uses existing brand colors (`#18A5A5`, `#185166`), mobile-first, clean and conversion-focused.

---

## Page 2: Free Quote Lead Capture (`/free-quote`)

The lead capture step before sending users into the booking form.

**Sections:**
1. **Headline** - "Get Your Free Cleaning Quote... in under 2 Minutes"
2. **Sub-headline** - "Plus Get 10% Off Your First Cleaning If You Checkout Using The Hassle Free Portal"
3. **Lead Form** - Full Name + Email fields, "Next" button
4. **Trust Badges** - 3 checkmarks: "Free Quote & Hassle Free Sign Up In Under 2 Minutes", "Trusted by London & Essex Homeowners", "Easy Support On WhatsApp"
5. **Testimonials** - Same 3 reviews

**On submit:** Saves the lead to the `quote_leads` table (already exists in the system), then redirects to `/services` (the existing ChooseService page) with name and email passed as query params.

---

## Page 3: Post-Payment Confirmation Update

The existing `/booking-confirmation` page already handles this. We will add an enhanced version of the "what happens next" content from the document:

- "Payment received. You're booked in."
- 4-step checklist: review details, assign supervisor, confirm first clean date, photo reports after each clean
- Contact options: WhatsApp, Email, Phone

This updates the existing `BookingConfirmation.tsx` rather than creating a new page.

---

## Technical Details

### New Files to Create
- `src/pages/LandingPage.tsx` - The VSL landing page (Page 1)
- `src/pages/FreeQuote.tsx` - The lead capture page (Page 2)
- `src/components/landing/LandingHero.tsx` - Hero section component
- `src/components/landing/LandingVideoPlaceholder.tsx` - Video placeholder component
- `src/components/landing/LandingTestimonials.tsx` - Testimonials section
- `src/components/landing/LandingReasons.tsx` - "3 key reasons" section
- `src/components/landing/LandingCTA.tsx` - Reusable CTA button component
- `src/components/landing/FreeQuoteForm.tsx` - Lead capture form component
- `src/components/landing/TrustBadges.tsx` - Trust badges component

### Files to Modify
- `src/App.tsx` - Add routes for `/lp` and `/free-quote`
- `src/pages/BookingConfirmation.tsx` - Add the "what happens next" steps from the document

### Routing and Flow

```text
Ad / Link --> /lp (Landing Page)
                |
                v
         CTA "Get my FREE quote"
                |
                v
           /free-quote (Lead Capture: Name + Email)
                |
                v
         Save lead to quote_leads table
                |
                v
           /services (Existing ChooseService page - pick service type)
                |
                v
     /domestic or /airbnb or /end-of-tenancy (Existing booking forms)
                |
                v
     /booking-confirmation (Enhanced with "what happens next")
```

### UTM Tracking
The landing page will use the existing `captureTrackingParams()` logic from `ChooseService.tsx` to capture UTM parameters on arrival, ensuring ad attribution is preserved through the funnel.

### No Design Changes to Existing Pages
All existing pages remain untouched in terms of design. Only the `BookingConfirmation.tsx` gets the additional "what happens next" content added below the existing confirmation UI.

