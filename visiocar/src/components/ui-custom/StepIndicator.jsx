import React from 'react';
import { cn } from "@/lib/utils";
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StepIndicator({ 
  steps, 
  currentStep,
  className 
}) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted ? "#34C759" : isCurrent ? "#007AFF" : "rgba(255,255,255,0.06)"
                  }}
                  className={cn(
                    "relative w-10 h-10 rounded-full flex items-center justify-center",
                    "border-2 transition-colors duration-300",
                    isCompleted ? "border-[#34C759]" : isCurrent ? "border-[#007AFF] shadow-[0_0_20px_rgba(0,122,255,0.4)]" : "border-white/10"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className={cn(
                      "text-sm font-semibold",
                      isCurrent ? "text-white" : "text-white/40"
                    )}>
                      {index + 1}
                    </span>
                  )}
                </motion.div>
                <div className="hidden lg:block">
                  <p className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-white" : isCompleted ? "text-[#34C759]" : "text-white/40"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-white/30">{step.description}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-[#34C759] to-[#007AFF]"
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/50">
            Étape {currentStep + 1} sur {steps.length}
          </span>
          <span className="text-sm font-medium text-[#007AFF]">
            {steps[currentStep]?.title}
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-[#007AFF] to-[#34C759] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}