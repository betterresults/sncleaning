import { Volume2, VolumeX } from 'lucide-react';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VIDEO_PATH = 'Landing Page video.mp4';

const LandingVideoPlaceholder = () => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl = supabase.storage
    .from('landing-assets')
    .getPublicUrl(VIDEO_PATH).data.publicUrl;

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="aspect-video rounded-2xl overflow-hidden bg-black relative group">
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
          <button
            onClick={toggleMute}
            className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-full transition-opacity opacity-70 group-hover:opacity-100"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </section>
  );
};

export default LandingVideoPlaceholder;
