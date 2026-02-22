import { CheckCircle } from 'lucide-react';

const badges = [
  'Free Quote & Hassle Free Sign Up In Under 2 Minutes',
  'Trusted by London & Essex Homeowners',
  'Easy Support On WhatsApp',
];

const TrustBadges = () => {
  return (
    <div className="flex flex-col gap-3 mt-6">
      {badges.map((badge, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-[#18A5A5] flex-shrink-0" />
          <span>{badge}</span>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
