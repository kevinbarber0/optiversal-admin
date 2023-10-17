import { useState, useCallback } from 'react';

export default (fn, delay = 1000) => {
  const [timerHandler, setTimerHandler] = useState(null);

  // State and setters for debounced value
  const debouncedFn = useCallback(() => {
    if (timerHandler) {
      clearTimeout(timerHandler);
    }
    setTimerHandler(
      setTimeout(() => {
        fn();
      }, delay),
    );
  }, [fn, delay]);

  return debouncedFn;
};
