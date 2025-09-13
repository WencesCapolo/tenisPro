"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoldenBadgeProps {
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  animated?: boolean;
}

export const GoldenBadge: React.FC<GoldenBadgeProps> = ({ 
  children, 
  className, 
  showIcon = true, 
  animated = true 
}) => {
  return (
    <Badge 
      className={cn(
        // Base golden styling
        "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600",
        "text-yellow-900 font-bold border-2 border-yellow-600",
        "shadow-lg shadow-yellow-500/25",
        // Animated sparkle effect
        animated && "animate-pulse",
        // Hover effects
        "hover:shadow-xl hover:shadow-yellow-500/40 transition-all duration-1000",
        "relative overflow-hidden",
        className
      )}
    >
      {/* Sparkle overlay effect */}
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}
      
      <div className="flex items-center gap-1 relative z-10">
        {showIcon && <Crown className="w-3 h-3" />}
        {children}
        {showIcon && <Sparkles className="w-3 h-3" />}
      </div>
    </Badge>
  );
};

// Special variant for professional tennis balls
export const ProfessionalTennisBallBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <GoldenBadge className={className} animated={true}>
      🥎 PELOTA PROFESIONAL ⭐
    </GoldenBadge>
  );
};
