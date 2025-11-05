import { Check, Sparkles, Home, Bath, ChefHat, Bed, Building } from "lucide-react";

const ChecklistSection = () => {
  const kitchenTasks = [
    "All worktops cleaned and degreased",
    "Cupboards cleaned inside, outside and on top",
    "Sink and taps descaled to shine",
    "Oven deep cleaned including trays and hob",
    "Fridge/freezer cleaned inside and out",
    "Dishwasher cleaned inside and outside",
    "Washing machine drawer and seals cleaned",
    "Microwave and appliances cleaned",
    "Windows, sills and handles cleaned"
  ];

  const bathroomTasks = [
    "Bath, shower and screen descaled",
    "Toilet disinfected inside and out",
    "Sink and taps cleaned and descaled", 
    "All tiles and grout deep cleaned",
    "Mirrors and glass surfaces polished",
    "Extractor fan and vents cleaned",
    "Skirting boards wiped clean",
    "Radiators and light fittings dusted",
    "Floors vacuumed and mopped"
  ];

  const bedroomTasks = [
    "Wardrobes cleaned inside, outside, and on top",
    "Furniture moved and cleaned behind",
    "Drawers and bedside tables detailed clean",
    "Windows and sills cleaned thoroughly",
    "Light switches and sockets wiped",
    "Skirting boards detailed clean",
    "Radiators cleaned behind and around",
    "Carpets deep cleaned or floors mopped",
    "Cobwebs removed from all corners"
  ];

  const livingRoomTasks = [
    "All furniture moved and cleaned behind",
    "TV units cleaned inside and out",
    "Sofas vacuumed underneath",
    "Coffee tables detailed clean",
    "Bookshelves dusted inside and out",
    "Windows and frames cleaned",
    "Light switches and sockets wiped",
    "Skirting boards cleaned",
    "Carpets deep cleaned or floors mopped"
  ];

  const hallwayTasks = [
    "All skirting boards and door frames cleaned",
    "Light switches and sockets wiped",
    "Stairs and banisters thoroughly cleaned",
    "Storage cupboards cleaned inside and out",
    "Mirrors and glass surfaces polished",
    "Radiators dusted and cleaned behind",
    "Hard floors mopped or carpets cleaned",
    "Cobwebs removed from corners",
    "Entry doors and handles cleaned"
  ];

  const generalTasks = [
    "All windows cleaned inside",
    "Window sills and frames detailed",
    "Internal doors and handles wiped",
    "Light fittings and ceiling fans dusted",
    "Picture rails and architraves cleaned",
    "Electrical sockets and switches wiped",
    "Carpets professionally cleaned",
    "Hard floors vacuumed and mopped",
    "Final inspection and touch-ups"
  ];

  const TaskList = ({ title, tasks, icon: Icon }: { 
    title: string; 
    tasks: string[];
    icon: any;
  }) => (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h4 className="text-xl font-bold font-heading text-foreground">
          {title}
        </h4>
      </div>
      
      <ul className="space-y-3">
        {tasks.map((task, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center mt-0.5">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-muted-foreground leading-relaxed">{task}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section className="section-padding bg-background">
      <div className="section-container">
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Professional Deep Clean</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground leading-tight">
            A Checklist That Leaves{" "}
            <span className="text-primary">
              Nothing to Chance
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We clean everything. Our comprehensive service ensures every corner of your property meets 
            the highest standards for final inspection.
          </p>
        </div>

        <div className="space-y-8">
          {/* First Row - 3 sections */}
          <div className="grid lg:grid-cols-3 gap-8">
            <TaskList
              title="Kitchen Deep Clean"
              tasks={kitchenTasks}
              icon={ChefHat}
            />
            <TaskList
              title="Bathroom Sanitisation"
              tasks={bathroomTasks}
              icon={Bath}
            />
            <TaskList
              title="Bedrooms"
              tasks={bedroomTasks}
              icon={Bed}
            />
          </div>

          {/* Second Row - 3 sections */}
          <div className="grid lg:grid-cols-3 gap-8">
            <TaskList
              title="Living Areas"
              tasks={livingRoomTasks}
              icon={Home}
            />
            <TaskList
              title="Hallways & Stairs"
              tasks={hallwayTasks}
              icon={Building}
            />
            <TaskList
              title="General Areas"
              tasks={generalTasks}
              icon={Sparkles}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChecklistSection;