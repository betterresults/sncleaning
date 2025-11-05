export interface ServicePageData {
  // Hero Section
  page_title: string;
  page_h1: string;
  under_heading: string;
  page_area: string;
  page_borough: string;
  
  // About Section
  page_subheading: string;
  page_subheading_description: string;
  
  // Content Section
  page_h2: string;
  page_h2_paragraph: string;
  page_h3: string;
  page_h3_paragraph: string;
  
  // FAQ Section
  page_question_1: string;
  page_question_2: string;
}

export interface StaticSectionData {
  // Process Section
  process_title?: string;
  process_description?: string;
  process_steps?: Array<{
    number: string;
    title: string;
    description: string;
  }>;
  
  // Testimonials
  testimonials_title?: string;
  testimonials_description?: string;
  
  // Checklist
  checklist_title?: string;
  checklist_description?: string;
  checklist_items?: string[];
  
  // Guarantee
  guarantee_title?: string;
  guarantee_description?: string;
  guarantee_content?: string;
  
  // Why Us
  why_us_title?: string;
  why_us_items?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}