import { MapPin, Clock, Phone } from "lucide-react";

const ServiceAreasSection = () => {
  const areas = [
    "South Hornchurch",
    "Hornchurch", 
    "Upminster",
    "Rainham",
    "Elm Park",
    "Romford",
    "Gidea Park",
    "Harold Wood",
    "Harold Hill",
    "Emerson Park",
    "Cranham",
    "North Ockendon"
  ];

  return (
    <section className="section-padding bg-muted/20">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-6">
            London <span className="text-primary">Boroughs</span> We Cover
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional end of tenancy cleaning across all areas of Greater London
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="card-glass p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center justify-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              Boroughs We Cover
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {areas.map((area, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="font-medium text-foreground">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreasSection;