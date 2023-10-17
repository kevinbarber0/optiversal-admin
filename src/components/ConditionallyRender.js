import { useEffect, useState } from 'react';

export default function ConditionallyRender({ mode, children }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted && mode === 'client') {
    return null;
  }

  if (isMounted && mode === 'server') {
    return null;
  }
  return children;
}
