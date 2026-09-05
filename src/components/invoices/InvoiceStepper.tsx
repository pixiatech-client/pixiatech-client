'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface InvoiceStepConfig {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface InvoiceStepperProps {
  steps: InvoiceStepConfig[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function InvoiceStepper({ steps, currentStep, onStepClick }: InvoiceStepperProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-6 sm:px-8">
      <div className="flex items-start">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = isCompleted || isActive;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-start w-full">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0',
                    isActive && 'bg-[#004ac6] text-white ring-4 ring-[#004ac6]/15 scale-110',
                    isCompleted && 'bg-[#004ac6] text-white hover:bg-[#003ea8]',
                    !isActive && !isCompleted && 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
                <p
                  className={cn(
                    'mt-2 text-[10px] sm:text-xs font-semibold text-center leading-tight px-0.5',
                    isActive ? 'text-[#004ac6]' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {step.label}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 mt-[18px] sm:mt-5 mx-2 sm:mx-4">
                  <div
                    className={cn(
                      'h-0.5 rounded transition-colors duration-300',
                      isCompleted || isActive ? 'bg-[#004ac6]' : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}