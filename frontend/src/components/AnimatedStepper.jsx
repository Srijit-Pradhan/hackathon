/**
 * AnimatedStepper component
 * Adapted from AnimatedStepper TSX to plain JSX.
 * Colors mapped to project palette: forest / paper / grid.
 * Removed TypeScript types and ShadCN CSS variables.
 */

import { useState, Children, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

// ─── Palette constants (maps ShadCN vars → project colors) ────────────────────
const COLORS = {
  primary: '#1A3C2B',          // forest
  primaryFg: '#F7F7F5',        // paper
  background: '#F7F7F5',       // paper
  card: '#ffffff',
  border: 'rgba(58,58,56,0.2)',// grid/20
  secondary: '#EFEFED',        // light paper
  mutedFg: 'rgba(58,58,56,0.6)', // grid/60
};

// ─── Step variants ─────────────────────────────────────────────────────────────
const stepVariants = {
  enter: (dir) => ({ x: dir >= 0 ? 20 : -20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir >= 0 ? -20 : 20, opacity: 0 }),
};

// ─── SlideTransition ───────────────────────────────────────────────────────────
function SlideTransition({ children, direction, onHeightReady }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// ─── StepContentWrapper ────────────────────────────────────────────────────────
function StepContentWrapper({ isCompleted, currentStep, direction, children, className = '' }) {
  const [parentHeight, setParentHeight] = useState(0);

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight || 'auto' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={(h) => setParentHeight(h)}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── StepConnector ─────────────────────────────────────────────────────────────
function StepConnector({ isComplete }) {
  return (
    <div
      className="relative mx-4 flex-1 overflow-hidden"
      style={{ height: '2px', backgroundColor: COLORS.border, borderRadius: '9999px' }}
    >
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: COLORS.primary,
          originX: 0,
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isComplete ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      />
    </div>
  );
}

// ─── StepIndicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators = false }) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const circleColors = {
    inactive: { bg: COLORS.secondary, color: COLORS.mutedFg, border: COLORS.border },
    active:   { bg: COLORS.background, color: COLORS.primary, border: COLORS.primary },
    complete: { bg: COLORS.primary,    color: COLORS.primaryFg, border: COLORS.primary },
  }[status];

  return (
    <div
      onClick={() => !disableStepIndicators && onClickStep(step)}
      className={`relative flex items-center justify-center ${!disableStepIndicators ? 'cursor-pointer' : ''}`}
    >
      <motion.div
        animate={{
          backgroundColor: circleColors.bg,
          color: circleColors.color,
          borderColor: circleColors.border,
        }}
        transition={{ duration: 0.3 }}
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold"
      >
        {status === 'complete' ? (
          <Check className="h-5 w-5" />
        ) : (
          <span className="text-sm font-mono">{step}</span>
        )}
      </motion.div>

      {/* Active glow */}
      {status === 'active' && (
        <motion.div
          layoutId="active-glow"
          className="absolute -inset-1 rounded-full blur-sm"
          style={{ backgroundColor: `${COLORS.primary}33` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </div>
  );
}

// ─── Step (public sub-component) ───────────────────────────────────────────────
export function Step({ children, title }) {
  return (
    <div className="py-4">
      {title && (
        <h2 className="mb-4 text-xl font-bold tracking-tight font-display" style={{ color: COLORS.primary }}>
          {title}
        </h2>
      )}
      <div style={{ color: COLORS.mutedFg }} className="leading-relaxed">
        {children}
      </div>
    </div>
  );
}

// ─── AnimatedStepper (main export) ────────────────────────────────────────────
export function AnimatedStepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  // Return false to block advancing from the given step number
  validateStep = () => true,
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);

  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep && validateStep(currentStep)) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    if (validateStep(currentStep)) {
      setDirection(1);
      updateStep(totalSteps + 1);
    }
  };

  return (
    <div className="w-full">
      {/* Card container — uses project card style */}
      <div className="card overflow-hidden">

        {/* Step indicators + connectors */}
        <div className="flex w-full items-center pb-6 border-b border-grid/10 mb-2">
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <div key={stepNumber} className="flex items-center flex-1 last:flex-none">
                <StepIndicator
                  step={stepNumber}
                  currentStep={currentStep}
                  disableStepIndicators={disableStepIndicators}
                  onClickStep={(clicked) => {
                    setDirection(clicked > currentStep ? 1 : -1);
                    updateStep(clicked);
                  }}
                />
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </div>
            );
          })}
        </div>

        {/* Animated content area */}
        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {/* Footer — Back + Next/Complete */}
        {!isCompleted && (
          <div className="flex items-center pt-4 border-t border-grid/10 mt-2"
            style={{ justifyContent: currentStep !== 1 ? 'space-between' : 'flex-end' }}
          >
            {currentStep !== 1 && (
              <button
                onClick={handleBack}
                className="font-mono text-xs uppercase tracking-widest transition-colors"
                style={{ color: COLORS.mutedFg }}
              >
                {backButtonText}
              </button>
            )}
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              disabled={!validateStep(currentStep)}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLastStep ? 'Create Incident' : nextButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnimatedStepper;
