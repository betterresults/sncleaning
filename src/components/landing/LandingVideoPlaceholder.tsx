import { Play } from 'lucide-react';

const LandingVideoPlaceholder = () => {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="aspect-video bg-gradient-to-br from-[#185166]/5 to-[#18A5A5]/5 rounded-2xl border-2 border-dashed border-[#18A5A5]/30 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#18A5A5]/10 mb-4">
              <Play className="h-8 w-8 text-[#18A5A5] ml-1" />
            </div>
            <p className="text-[#185166]/60 font-medium">Video coming soon</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingVideoPlaceholder;
