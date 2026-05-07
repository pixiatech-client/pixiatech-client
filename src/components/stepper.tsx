

'use client';

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LucideIcon } from "lucide-react";

type Step = {
  id: number;
  label: string;
  icon: LucideIcon;
};

interface StepperProps {
    currentStep: number;
    onStepClick: (step: number) => void;
    steps: Step[];
}

export function Stepper({ currentStep, onStepClick, steps }: StepperProps) {
  const { t } = useI18n();
  const isMobile = useIsMobile();

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center w-full">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onStepClick(step.id)}
                  disabled={!isCompleted && !isActive}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300",
                    isActive 
                      ? "bg-black text-white scale-110" 
                      : isCompleted 
                      ? "bg-black/80 text-white hover:bg-black/90" 
                      : "bg-gray-200 text-gray-500",
                    (isCompleted || isActive) && "cursor-pointer"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
                <p className={cn(
                    "mt-2 text-xs font-semibold text-center",
                     isActive ? "text-primary" : "text-muted-foreground",
                     isMobile && "hidden"
                )}>
                    {t(step.label)}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-auto border-t-2 transition-colors duration-300 mx-4"
                     style={{ borderColor: isCompleted || isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
