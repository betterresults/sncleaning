import { MapPin } from "lucide-react";

const TemplateServiceAreasSection = () => {
  return (
    <section className="section-padding bg-muted/20">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            Areas in <span className="bg-orange-300/30 px-1 rounded">[page_borough]</span> We <span className="text-primary">Cover</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional cleaning services across <span className="bg-orange-300/30 px-1 rounded">[page_borough]</span>
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Dynamic areas - PHP will loop through all pages where borough = [page_borough] */}
              <div className="bg-orange-300/30 px-4 py-2 rounded-lg border border-orange-400 text-center">
                <div className="text-sm text-muted-foreground mb-4">
                  PHP: foreach($pages where borough = [page_borough]) {"{"}
                </div>
                
                {/* Example of what each dynamic card will look like */}
                <a href="[page_url]" className="block">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 hover:shadow-md bg-cyan-50 border-cyan-200 hover:bg-cyan-100 cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="font-medium text-foreground text-sm">
                      [page_area]
                    </span>
                  </div>
                </a>
                
                <div className="text-sm text-muted-foreground mt-4">
                  {"}"} // End PHP loop
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  Each card links to: /end-of-tenancy-cleaning-[page_area_slug]
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TemplateServiceAreasSection;