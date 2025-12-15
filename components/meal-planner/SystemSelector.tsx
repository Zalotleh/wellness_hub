'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Info, Target } from 'lucide-react';
import { DEFENSE_SYSTEMS } from '@/lib/constants/defense-systems';
import { DefenseSystem } from '@/types';

interface SystemSelectorProps {
  selectedSystems: DefenseSystem[];
  onSelectionChange: (systems: DefenseSystem[]) => void;
  maxSelections?: number;
  showDescription?: boolean;
  className?: string;
}

export default function SystemSelector({
  selectedSystems,
  onSelectionChange,
  maxSelections = 5,
  showDescription = true,
  className = '',
}: SystemSelectorProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const systems = Object.entries(DEFENSE_SYSTEMS);
  const remainingSelections = maxSelections - selectedSystems.length;

  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, systems.length);
  }, [systems.length]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event;
    const cols = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    const totalItems = systems.length;

    let newIndex = focusedIndex;

    switch (key) {
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (focusedIndex + 1) % totalItems;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = focusedIndex <= 0 ? totalItems - 1 : focusedIndex - 1;
        break;
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (focusedIndex + cols) % totalItems;
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = focusedIndex - cols;
        if (newIndex < 0) newIndex = totalItems + newIndex;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0) {
          handleSystemToggle(systems[focusedIndex][0] as DefenseSystem);
        }
        break;
      case 'Escape':
        setFocusedIndex(-1);
        setShowTooltip(null);
        break;
      default:
        return;
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
      buttonRefs.current[newIndex]?.focus();
    }
  };

  const handleSystemToggle = (systemKey: DefenseSystem) => {
    const isSelected = selectedSystems.includes(systemKey);
    
    // Add animation
    setAnimatingItems(prev => new Set(prev).add(systemKey));
    setTimeout(() => {
      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(systemKey);
        return newSet;
      });
    }, 300);
    
    if (isSelected) {
      // Always allow deselection
      onSelectionChange(selectedSystems.filter(s => s !== systemKey));
    } else if (remainingSelections > 0) {
      // Only allow selection if under limit
      onSelectionChange([...selectedSystems, systemKey]);
    }
  };

  const handleMouseEnter = (systemKey: string, index: number) => {
    setShowTooltip(systemKey);
    setFocusedIndex(index);
  };

  const handleMouseLeave = () => {
    setShowTooltip(null);
    setFocusedIndex(-1);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Header with Prominent Counter */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Focus Systems
              </h3>
              {showDescription && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Select defense systems to emphasize in your meal plan
                </p>
              )}
            </div>
          </div>
          
          {/* Prominent Selection Counter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {selectedSystems.length}
                <span className="text-lg text-gray-500 dark:text-gray-400 font-normal"> of {maxSelections}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                Systems Selected
              </div>
              {remainingSelections > 0 && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {remainingSelections} more available
                </div>
              )}
              {remainingSelections === 0 && selectedSystems.length > 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Maximum reached
                </div>
              )}
            </div>
            
            {/* Visual Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(selectedSystems.length / maxSelections) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Systems Grid with Glow Effects */}
      <div 
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {systems.map(([key, system], index) => {
          const isSelected = selectedSystems.includes(key as DefenseSystem);
          const isDisabled = !isSelected && remainingSelections <= 0;
          const isFocused = focusedIndex === index;
          const isAnimating = animatingItems.has(key);
          
          return (
            <div key={key} className="relative">
              <button
                ref={el => { buttonRefs.current[index] = el; }}
                onClick={() => handleSystemToggle(key as DefenseSystem)}
                onMouseEnter={() => handleMouseEnter(key, index)}
                onMouseLeave={handleMouseLeave}
                onFocus={() => setFocusedIndex(index)}
                disabled={isDisabled}
                className={`
                  relative w-full p-5 rounded-xl border-2 text-left transition-all duration-300 ease-out transform
                  focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:ring-offset-2
                  ${isSelected
                    ? `border-transparent bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30
                       shadow-xl shadow-green-500/25 ring-4 ring-green-500/20
                       before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br 
                       before:from-green-400/20 before:to-emerald-400/20 before:blur-sm before:-z-10`
                    : isDisabled
                      ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                      : `border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-lg hover:shadow-gray-200/50
                         hover:scale-[1.02] hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-800`
                  }
                  ${isFocused && !isDisabled ? 'ring-4 ring-green-500/30 scale-[1.02]' : ''}
                  ${isAnimating ? 'animate-pulse scale-105' : ''}
                `}
                aria-pressed={isSelected}
                aria-describedby={`system-${key}-desc`}
                style={{
                  boxShadow: isSelected 
                    ? `0 0 30px rgba(34, 197, 94, 0.3), 0 10px 40px rgba(0, 0, 0, 0.1)`
                    : undefined
                }}
              >
                {/* Glow Effect Overlay for Selected Items */}
                {isSelected && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur opacity-30 -z-10 animate-pulse" />
                )}
                
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Enhanced Icon and Name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                        ${isSelected 
                          ? 'bg-gradient-to-br from-white to-green-50 dark:from-green-900/50 dark:to-green-800/30 shadow-lg ring-2 ring-green-500/30' 
                          : 'bg-gray-100 dark:bg-gray-700'
                        }
                      `}>
                        <span className="text-2xl" role="img" aria-hidden="true">
                          {system.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className={`
                          font-bold text-base transition-colors duration-300
                          ${isSelected ? 'text-green-800 dark:text-green-300' : 'text-gray-900 dark:text-white'}
                        `}>
                          {system.displayName}
                        </h4>
                        <div className={`
                          text-xs font-medium uppercase tracking-wide transition-colors duration-300
                          ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}
                        `}>
                          Defense System
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p 
                      id={`system-${key}-desc`}
                      className={`
                        text-sm leading-relaxed transition-colors duration-300
                        ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-300'}
                      `}
                    >
                      {system.description}
                    </p>
                  </div>
                  
                  {/* Enhanced Selection Indicator */}
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white animate-bounce">
                          <Check className="w-5 h-5 text-white font-bold" />
                        </div>
                        {/* Pulse effect */}
                        <div className="absolute inset-0 w-8 h-8 bg-green-500 rounded-full animate-ping opacity-20" />
                      </div>
                    ) : (
                      <div className={`
                        w-8 h-8 rounded-full border-2 transition-all duration-300
                        ${isDisabled 
                          ? 'border-gray-300 dark:border-gray-600' 
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-green-400'
                        }
                      `} />
                    )}
                  </div>
                </div>

                {/* Enhanced Hover Tooltip */}
                {showTooltip === key && !isDisabled && (
                  <div className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 animate-fade-in">
                    <div className="px-4 py-3 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-xl shadow-2xl max-w-xs border border-gray-700 dark:border-gray-600">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-800 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Info className="w-4 h-4 text-gray-300 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{system.displayName}</div>
                          <div className="text-gray-300 dark:text-gray-400 mt-1 text-xs leading-relaxed">
                            {system.description}
                          </div>
                          {system.keyFoods && system.keyFoods.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-700 dark:border-gray-600">
                              <div className="text-xs font-medium text-gray-400 mb-1">Key Foods:</div>
                              <div className="text-xs text-gray-300 dark:text-gray-400">
                                {system.keyFoods.slice(0, 3).join(', ')}
                                {system.keyFoods.length > 3 && `...`}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Enhanced Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 dark:bg-gray-800 rotate-45 border-r border-b border-gray-700 dark:border-gray-600"></div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Enhanced Selected Systems Summary */}
      {selectedSystems.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="font-semibold text-green-800 dark:text-green-300">Selected Systems</div>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              {selectedSystems.length} active
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedSystems.map((systemKey, index) => {
              const system = DEFENSE_SYSTEMS[systemKey];
              return (
                <div 
                  key={systemKey}
                  className="group bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-all duration-200"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'slideInUp 0.3s ease-out forwards'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{system?.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-green-800 dark:text-green-300 text-sm truncate">
                          {system?.displayName}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">Active</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSystemToggle(systemKey)}
                      className="w-6 h-6 text-green-400 hover:text-green-600 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                      aria-label={`Remove ${system?.displayName}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhanced Keyboard Navigation Help */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l6-6v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm13-13v8.134c0 .656-.126 1.283-.356 1.853a4.13 4.13 0 01-.994 1.548 4.267 4.267 0 01-1.548.994c-.57.23-1.197.356-1.853.356-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2v-8.134z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">Keyboard Navigation</div>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Arrow keys</kbd> Navigate systems</div>
              <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Space/Enter</kbd> Select system</div>
              <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Escape</kbd> Clear focus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}