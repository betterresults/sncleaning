import { Calendar, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const RecentBlogPostsSection = () => {
  const blogPosts = [
    {
      title: "Ultimate End of Tenancy Cleaning Checklist",
      excerpt: "Everything you need to know to get your full deposit back. Our comprehensive guide covers every room and essential cleaning task.",
      date: "March 15, 2024",
      readTime: "5 min read",
      category: "Guides",
      image: "/images/blog/cleaning-checklist.jpg"
    },
    {
      title: "Spring Cleaning Tips from Professional Cleaners",
      excerpt: "Transform your home with expert tips and tricks from our professional cleaning team. Make your spring cleaning efficient and thorough.",
      date: "March 10, 2024", 
      readTime: "3 min read",
      category: "Tips",
      image: "/images/blog/spring-cleaning.jpg"
    },
    {
      title: "How to Choose the Right Cleaning Service",
      excerpt: "Key factors to consider when selecting a professional cleaning service. Learn what questions to ask and red flags to avoid.",
      date: "March 5, 2024",
      readTime: "4 min read", 
      category: "Advice",
      image: "/images/blog/choosing-service.jpg"
    }
  ];

  return (
    <section className="section-padding bg-background">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            Latest <span className="text-primary">Cleaning Tips</span> & Insights
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay updated with expert cleaning advice, industry insights, and helpful tips from our professional team
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {blogPosts.map((post, index) => (
            <article 
              key={index}
              className="card-feature group cursor-pointer hover:shadow-primary transition-all duration-300"
            >
              {/* Image Placeholder */}
              <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/5 rounded-xl mb-6 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Blog Image</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex items-center text-primary font-medium group-hover:gap-3 transition-all duration-300">
                  <span>Read More</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* View All Posts Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            View All Blog Posts
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecentBlogPostsSection;