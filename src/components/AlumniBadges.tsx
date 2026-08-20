import React from 'react';
import { 
  Award, 
  Crown, 
  BadgeCheck, 
  Briefcase, 
  Medal, 
  Flame,
  Star,
  UserCheck
} from 'lucide-react';

interface AlumniBadgesProps {
  badges?: string[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
}

export const AlumniBadges: React.FC<AlumniBadgesProps> = ({ 
  badges = [], 
  size = 'md',
  maxDisplay = 4
}) => {
  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);

  const getBadgeConfig = (badgeName: string) => {
    const lower = badgeName.toLowerCase();

    if (lower.includes('mentor')) {
      return {
        icon: Award,
        bgClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        iconClass: 'text-amber-600',
        label: badgeName
      };
    }
    if (lower.includes('gold')) {
      return {
        icon: Crown,
        bgClass: 'bg-amber-400/20 text-amber-950 border-amber-400/80 font-black',
        iconClass: 'text-amber-600 fill-amber-400',
        label: badgeName
      };
    }
    if (lower.includes('batch') || lower.includes('representative') || lower.includes('rep')) {
      return {
        icon: BadgeCheck,
        bgClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
        iconClass: 'text-blue-600',
        label: badgeName
      };
    }
    if (lower.includes('recruiter') || lower.includes('hiring') || lower.includes('employer')) {
      return {
        icon: Briefcase,
        bgClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
        iconClass: 'text-emerald-600',
        label: badgeName
      };
    }
    if (lower.includes('founding') || lower.includes('leader') || lower.includes('executive')) {
      return {
        icon: Flame,
        bgClass: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
        iconClass: 'text-purple-600',
        label: badgeName
      };
    }

    return {
      icon: Medal,
      bgClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
      iconClass: 'text-slate-600',
      label: badgeName
    };
  };

  const sizeClasses = {
    sm: {
      container: 'px-1.5 py-0.5 text-[9px] space-x-1',
      icon: 'w-2.5 h-2.5'
    },
    md: {
      container: 'px-2 py-0.5 text-[10px] space-x-1',
      icon: 'w-3 h-3'
    },
    lg: {
      container: 'px-2.5 py-1 text-xs space-x-1.5',
      icon: 'w-3.5 h-3.5'
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displayBadges.map((badge, idx) => {
        const config = getBadgeConfig(badge);
        const IconComponent = config.icon;

        return (
          <span
            key={`${badge}-${idx}`}
            className={`inline-flex items-center rounded-full border shadow-2xs transition-all ${config.bgClass} ${currentSize.container}`}
            title={`Badge: ${config.label}`}
          >
            <IconComponent className={`${config.iconClass} ${currentSize.icon} shrink-0`} />
            <span className="whitespace-nowrap">{config.label}</span>
          </span>
        );
      })}
    </div>
  );
};
