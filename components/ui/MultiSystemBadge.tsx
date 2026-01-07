'use client';

import React from 'react';
import { DefenseSystem } from '@/types';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';

type BenefitStrength = 'HIGH' | 'MEDIUM' | 'LOW';

interface SystemBenefit {
  system: DefenseSystem;
  strength?: BenefitStrength;
}

interface MultiSystemBadgeProps {
  systems: SystemBenefit[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'compact';
  className?: string;
  showTooltip?: boolean;
}

const systemColors = {
  ANGIOGENESIS: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    hoverBg: 'hover:bg-red-200',
    darkBg: 'bg-red-600',
    darkText: 'text-red-50',
    abbreviation: 'A',
    color: '#dc2626', // red-600
  },
  REGENERATION: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    hoverBg: 'hover:bg-green-200',
    darkBg: 'bg-green-600',
    darkText: 'text-green-50',
    abbreviation: 'R',
    color: '#16a34a', // green-600
  },
  MICROBIOME: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    hoverBg: 'hover:bg-purple-200',
    darkBg: 'bg-purple-600',
    darkText: 'text-purple-50',
    abbreviation: 'M',
    color: '#9333ea', // purple-600
  },
  DNA_PROTECTION: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    hoverBg: 'hover:bg-blue-200',
    darkBg: 'bg-blue-600',
    darkText: 'text-blue-50',
    abbreviation: 'D',
    color: '#2563eb', // blue-600
  },
  IMMUNITY: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    hoverBg: 'hover:bg-orange-200',
    darkBg: 'bg-orange-600',
    darkText: 'text-orange-50',
    abbreviation: 'I',
    color: '#ea580c', // orange-600
  },
} as const;

const sizeClasses = {
  sm: {
    badge: 'h-5 px-1.5 text-xs',
    gap: 'gap-0.5',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'h-6 px-2 text-sm',
    gap: 'gap-1',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'h-8 px-3 text-base',
    gap: 'gap-1.5',
    icon: 'w-5 h-5',
  },
} as const;

const strengthIndicators = {
  HIGH: { dots: '●●●', opacity: 'opacity-100' },
  MEDIUM: { dots: '●●○', opacity: 'opacity-80' },
  LOW: { dots: '●○○', opacity: 'opacity-60' },
} as const;

export default function MultiSystemBadge({
  systems,
  size = 'md',
  variant = 'compact',
  className = '',
  showTooltip = true,
}: MultiSystemBadgeProps) {
  if (!systems || systems.length === 0) {
    return null;
  }

  const sizeClass = sizeClasses[size];

  // Sort systems in order: A R M D I
  const systemOrder = ['ANGIOGENESIS', 'REGENERATION', 'MICROBIOME', 'DNA_PROTECTION', 'IMMUNITY'];
  const sortedSystems = [...systems].sort(
    (a, b) => systemOrder.indexOf(a.system) - systemOrder.indexOf(b.system)
  );

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center ${sizeClass.gap} ${className}`}>
        {sortedSystems.map(({ system, strength }) => {
          const colors = systemColors[system];
          const systemInfo = DEFENSE_SYSTEMS[system];
          
          return (
            <div
              key={system}
              className={`
                inline-flex items-center justify-center
                ${sizeClass.badge}
                ${colors.bg} ${colors.text} ${colors.border}
                border rounded font-semibold
                ${showTooltip ? 'cursor-help' : ''}
                transition-colors duration-200
                ${colors.hoverBg}
              `}
              title={showTooltip ? `${systemInfo.name}${strength ? ` (${strength})` : ''}` : undefined}
            >
              {colors.abbreviation}
              {strength && (
                <span className="ml-0.5 text-[0.6em] opacity-70">
                  {strengthIndicators[strength].dots}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full variant with system names
  return (
    <div className={`inline-flex flex-wrap ${sizeClass.gap} ${className}`}>
      {sortedSystems.map(({ system, strength }) => {
        const colors = systemColors[system];
        const systemInfo = DEFENSE_SYSTEMS[system];
        
        return (
          <div
            key={system}
            className={`
              inline-flex items-center
              ${sizeClass.badge}
              ${colors.bg} ${colors.text} ${colors.border}
              border rounded-full px-3 font-medium
              transition-colors duration-200
              ${colors.hoverBg}
            `}
          >
            <span className="font-semibold mr-1">{colors.abbreviation}</span>
            <span className="whitespace-nowrap">{systemInfo.name}</span>
            {strength && (
              <span className="ml-1.5 text-xs opacity-70">
                {strength}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Export helper function to get system colors
export function getSystemColor(system: DefenseSystem): string {
  return systemColors[system].color;
}

// Export helper to create system benefits array
export function createSystemBenefits(
  systems: DefenseSystem[],
  strength?: BenefitStrength
): SystemBenefit[] {
  return systems.map(system => ({ system, strength }));
}
