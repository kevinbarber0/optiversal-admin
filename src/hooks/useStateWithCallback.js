const { useState, useRef, useEffect } = require('react');

const useStateWithCallback = (initialState) => {
  const [state, setState] = useState(initialState);
  const callbackRef = useRef(() => undefined);

  const setStateCB = (newState, callback) => {
    callbackRef.current = callback;
    setState(newState);
  };

  useEffect(() => {
    callbackRef.current?.();
  }, [state]);

  return [state, setStateCB];
};

export default useStateWithCallback;
