import { useState } from 'react';

// Wrap functions with a guard to prevent multiple simultaneous calls.
// Additionally, it provides a boolean state to indicate if the function is
// currently running.
function useWorkingState() {
  const [isWorking, setWorking] = useState(false);

  const workingGuard = async (fn) => {
    if (isWorking) return;
    setWorking(true);
    try {
      await fn();
    } finally {
      setWorking(false);
    }
  };

  const withWorkingGuard = (fn) => async () => workingGuard(fn);

  return { isWorking, setWorking, workingGuard, withWorkingGuard };
}

export default useWorkingState
