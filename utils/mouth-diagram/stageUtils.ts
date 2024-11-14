// stageUtils.ts
import Konva from 'konva';

export const calculateCoordination = (e: any) => {
  const stage = e.target.getStage();
  const pointerPosition = stage.getPointerPosition();
  const offset = { x: stage.x(), y: stage.y() };

  const imageClickX = (pointerPosition.x - offset.x) * (1 / stage.scaleX());
  const imageClickY = (pointerPosition.y - offset.y) * (1 / stage.scaleX());

  const imageWidth = stage.width();
  const imageHeight = stage.height();

  const maxY = 95;
  const minY = 5;
  const maxX = 90;
  const minX = 10;

  let xPercent = (imageClickX / imageWidth) * 100;
  let yPercent = (imageClickY / imageHeight) * 100;

  if (xPercent > maxX) {
    xPercent = maxX - 3;
  } else if (xPercent < minX) {
    xPercent = minX + 3;
  }
  if (yPercent > maxY) {
    yPercent = maxY - 3;
  } else if (yPercent < minY) {
    yPercent = minY + 3;
  }

  return {
    x: xPercent,
    y: yPercent,
  };
};

export const handleZoomStage =
  (stageRef: React.RefObject<Konva.Stage>, scaleBy: number = 1.02) =>
  (event: any) => {
    event.evt.preventDefault();
    if (stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const { x: pointerX, y: pointerY } = stage.getPointerPosition();
      const mousePointTo = {
        x: (pointerX - stage.x()) / oldScale,
        y: (pointerY - stage.y()) / oldScale,
      };
      const newScale =
        event.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      stage.scale({ x: newScale, y: newScale });
      const newPos = {
        x: pointerX - mousePointTo.x * newScale,
        y: pointerY - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    }
  };

export const handlePinchZoom =
  (stageRef: React.RefObject<Konva.Stage>, initialDistance?: number) =>
  (event: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    const touch1 = event.evt.touches[0];
    const touch2 = event.evt.touches[1];

    if (touch1 && touch2) {
      const dist = Math.sqrt(
        (touch1.clientX - touch2.clientX) ** 2 +
          (touch1.clientY - touch2.clientY) ** 2
      );

      if (!initialDistance) {
        initialDistance = dist;
      }

      const newScale = (dist / initialDistance) * stage.scaleX();
      stage.scale({ x: newScale, y: newScale });

      const { x: pointerX, y: pointerY } = stage.getPointerPosition();
      const mousePointTo = {
        x: (pointerX - stage.x()) / stage.scaleX(),
        y: (pointerY - stage.y()) / stage.scaleY(),
      };

      const newPos = {
        x: pointerX - mousePointTo.x * newScale,
        y: pointerY - mousePointTo.y * newScale,
      };

      stage.position(newPos);
      stage.batchDraw();
    }
  };

export const handleZoom = (
  stageRef: React.RefObject<Konva.Stage>,
  zoom: number
) => {
  if (stageRef.current) {
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const newScale = oldScale * zoom;

    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2,
    };

    const newPos = {
      x: center.x - (center.x - stage.x()) * (newScale / oldScale),
      y: center.y - (center.y - stage.y()) * (newScale / oldScale),
    };

    new Konva.Tween({
      node: stage,
      duration: 0.3,
      scaleX: newScale,
      scaleY: newScale,
      x: newPos.x,
      y: newPos.y,
      easing: Konva.Easings.EaseInOut,
    }).play();
  }
};

export const handleResetZoom = (stageRef: React.RefObject<Konva.Stage>) => {
  if (stageRef.current) {
    const stage = stageRef.current;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
  }
};
