import React, { useState, useEffect } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useAuth } from '../../contexts/AuthContext';

interface TutorialProps {
  tourId: string;
  steps: Step[];
}

export const Tutorial: React.FC<TutorialProps> = ({ tourId, steps }) => {
  const { currentUser, updateCompletedTours } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (currentUser && !currentUser.completedTours?.includes(tourId)) {
      // Small delay to ensure elements are rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, tourId]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (currentUser) {
        updateCompletedTours(currentUser.id, tourId);
      }
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress={false}
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#2563eb', // blue-600
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tutorial',
      }}
    />
  );
};
