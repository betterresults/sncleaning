import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const LandingCTA = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-10 bg-[#f5efe2]">
      <button
        onClick={() => navigate('/free-quote')}
        className="inline-flex items-center gap-3 bg-[#0d1b3d] hover:bg-[#0a1530] text-white text-base md:text-lg font-semibold tracking-wide px-10 md:px-14 py-4 md:py-5 rounded-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border-b-2 border-[#c9a84c]"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        GET MY FREE PERSONALISED QUOTE
        <ArrowRight className="h-5 w-5 text-[#c9a84c]" />
      </button>
    </div>
  );
};

export default LandingCTA;
