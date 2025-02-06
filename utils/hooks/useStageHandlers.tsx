import { useEffect } from 'react';

import {
  handlePinchZoom,
  handleResetZoom,
  handleZoomStage
} from '@/utils/mouth-diagram/stageUtils';

export const useStageHandlers = (stageRef: any, containerRef: any) => {
  let lastCenter: { x: number; y: number } | null = null;
  let lastDist = 0;

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

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        stage.draggable(false);
      }
    };

    const handleTouchEnd = () => {
      lastCenter = null;
      lastDist = 0;
      stage.draggable(true);
    };

    stage.on('touchstart', handleTouchStart);
    stage.on('touchend touchcancel', handleTouchEnd);

    return () => {
      stage.off('touchstart', handleTouchStart);
      stage.off('touchend touchcancel', handleTouchEnd);
    };
  }, [stageRef]);

  return { handleResetZoom, handleZoomStage, handlePinchZoom };
};
