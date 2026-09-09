// useStageSize.ts
import type { RefObject } from 'react';
import { useState, useEffect } from 'react';

export const useStageSize = (containerRef: RefObject<HTMLDivElement>) => {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateStageSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateStageSize();
    window.addEventListener('resize', updateStageSize);

    return () => {
      window.removeEventListener('resize', updateStageSize);
    };
  }, [containerRef]);

  return stageSize;
};
