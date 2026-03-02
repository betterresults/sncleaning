import { Play } from 'lucide-react';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VIDEO_PATH = 'landing-video.mp4';

const LandingVideoPlaceholder = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl = supabase.storage
    .from('landing-assets')
    .getPublicUrl(VIDEO_PATH).data.publicUrl;

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => videoRef.current?.play(), 100);
  };

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="aspect-video rounded-2xl overflow-hidden bg-black relative">
          {!isPlaying ? (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#185166]/5 to-[#18A5A5]/5 flex items-center justify-center cursor-pointer"
              onClick={handlePlay}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#18A5A5]/10 mb-4 hover:bg-[#18A5A5]/20 transition-colors">
                  <Play className="h-8 w-8 text-[#18A5A5] ml-1" />
                </div>
                <p className="text-[#185166]/60 font-medium">Watch our video</p>
              </div>
            </div>
          ) : null}
          <video
            ref={videoRef}
            src={videoUrl}
            controls={isPlaying}
            className={`w-full h-full object-cover ${!isPlaying ? 'hidden' : ''}`}
            playsInline
          />
        </div>
      </div>
    </section>
  );
};

export default LandingVideoPlaceholder;
