import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const LandingCTA = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-8">
      <button
        onClick={() => navigate('/free-quote')}
        className="inline-flex items-center gap-3 bg-[#18A5A5] hover:bg-[#159090] text-white text-lg md:text-xl font-bold px-8 md:px-12 py-4 md:py-5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        Get my FREE personalised quote
        <ArrowRight className="h-6 w-6" />
      </button>
    </div>
  );
};

export default LandingCTA;
