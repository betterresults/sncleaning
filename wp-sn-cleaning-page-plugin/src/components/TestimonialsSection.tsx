import { useEffect } from "react";

const TestimonialsSection = () => {
  useEffect(() => {
    // Load the testimonials widget script
    const script = document.createElement('script');
    script.innerHTML = `
      ! function(w, d){
        if (!w || !d) return false;    
        d.addEventListener("DOMContentLoaded", function(event) {
            var s = d.createElement('script');
            s.setAttribute('src','https://fbl.embedwidgets.com/dcWK51Qwf6A51i8gEolc.js');
            d.body.appendChild(s);
          });
        }(window, document)
    `;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      document.head.removeChild(script);
    };
  }, []);

  return (
    <section className="section-padding bg-gradient-to-br from-muted/20 to-background">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            What Our <span className="text-primary">Customers Say</span>
          </h2>
        </div>

        {/* Real Review Widget */}
        <div className="card-glass p-8 mb-12">
          <div className="fbl_w_dcWK51Qwf6A51i8gEolc"></div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;