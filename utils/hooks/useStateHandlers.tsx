import { useEffect } from 'react';

import {
  handlePinchZoom,
  handleResetZoom,
  handleZoomStage
} from '@/utils/mouth-diagram/stageUtils';

export const useStageHandlers = (stageRef: any, containerRef: any) => {
  useEffect(() => {
    const handleResize = () => {
      if (stageRef.current) {
        stageRef.current.width(containerRef.current?.clientWidth || 0);
        stageRef.current.height(containerRef.current?.clientHeight || 0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stageRef, containerRef]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const stage = stageRef.current;
    if (stage) {
      stage.on('touchmove', handleTouchMove);
    }

    return () => {
      if (stage) {
        stage.off('touchmove', handleTouchMove);
      }
    };
  }, [stageRef]);

  return { handleResetZoom, handleZoomStage, handlePinchZoom };
};
