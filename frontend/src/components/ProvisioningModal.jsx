import { useEffect, useState } from 'react';
import Modal from './Modal';

function ProvisioningModal({ isOpen, databaseName, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Initializing', duration: 1000 },
    { label: 'Generating configuration', duration: 1500 },
    { label: 'Running Terraform init', duration: 2000 },
    { label: 'Applying infrastructure', duration: 2500 },
    { label: 'Starting container', duration: 1500 },
    { label: 'Finalizing', duration: 1000 },
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    let timeoutId;
    let currentProgress = 0;
    let stepIndex = 0;

    const animateProgress = () => {
      if (currentProgress < 95 && stepIndex < steps.length) {
        const increment = Math.random() * 8 + 2;
        currentProgress = Math.min(currentProgress + increment, 95);
        setProgress(currentProgress);

        // Move to next step at certain thresholds
        const stepThreshold = ((stepIndex + 1) / steps.length) * 95;
        if (currentProgress >= stepThreshold && stepIndex < steps.length - 1) {
          stepIndex++;
          setCurrentStep(stepIndex);
        }

        timeoutId = setTimeout(animateProgress, steps[stepIndex]?.duration / 10 || 200);
      }
    };

    animateProgress();

    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Provisioning Database" hideCloseButton>
      <div className="space-y-6">
        {/* Database Name */}
        <div className="text-center">
          <p className="text-sm text-primary-gray-400 mb-1">Creating</p>
          <p className="text-xl font-semibold text-white">{databaseName}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-primary-gray-400">Progress</span>
            <span className="text-white font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-primary-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-orange to-primary-orange-dark transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-primary-gray-900 border border-primary-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary-orange animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{steps[currentStep]?.label}...</p>
              <p className="text-xs text-primary-gray-400 mt-0.5">
                This may take a few moments
              </p>
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  index < currentStep
                    ? 'border-green-500 bg-green-500'
                    : index === currentStep
                    ? 'border-primary-orange bg-primary-orange'
                    : 'border-primary-gray-700'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : index === currentStep ? (
                  <div className="w-2 h-2 bg-white rounded-full" />
                ) : null}
              </div>
              <p
                className={`text-sm ${
                  index <= currentStep ? 'text-white font-medium' : 'text-primary-gray-500'
                }`}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-400 leading-relaxed">
            <span className="font-semibold">Tip:</span> Your database will be available shortly.
            You'll be able to connect once provisioning is complete.
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default ProvisioningModal;
