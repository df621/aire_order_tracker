import { useRef, useEffect } from 'react';

export function useSwipe(onSwipeRight) {
  const startXRef = useRef(null);

  useEffect(() => {
    const handleTouchStart = (e) => {
      startXRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startXRef.current;
      if (diff > 100) {
        onSwipeRight();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeRight]);
}