import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Group, Label, Text, Rect } from 'react-konva';

import Images from './Images';

interface Coord {
  x: number;
  y: number;
}

const ImagePointGrid: React.FC = () => {
  const [image] = useState<string>('/assets/images/mouth.png');
  const [circleList, setCircleList] = useState<React.ReactNode[]>([]);
  const stageRef = useRef<any>(null);
  const [stageWidth, setStageWidth] = useState<number>(0);
  const [stageHeight, setStageHeight] = useState<number>(0);
  const [imageClickCoordList, setImageClickCoordList] = useState<Coord[]>([]);
  const [grid] = useState<number[]>([1, 2, 3, 4]);

  useEffect(() => {
    const jsonImageClickCoordList = JSON.parse(
      localStorage.getItem('imageClickCoordList') || '[]'
    );
    if (jsonImageClickCoordList.length) {
      circleListAfterReload(jsonImageClickCoordList);
    }
  }, []);

  const circleListAfterReload = useCallback(
    (imageClickCoordList: Coord[]) => {
      const circleListTemp = imageClickCoordList.map((cur, index) => {
        let rowCount = 0;
        let colCount = 0;
        const colLimit = 2;
        const offsetInit = -8;
        const offsetDistance = 25;

        return (
          <Label
            key={index + 1}
            id={index + 1}
            x={cur.x}
            y={cur.y}
            onClick={handleClickLabel}
          >
            {grid.map((_, i) => {
              colCount += 1;

              const gridNo = i + 1;
              const x = 25 * (colCount - 1);
              const y = rowCount ? 25 * rowCount : 0;
              const offsetX = offsetInit - offsetDistance * (colCount - 1);
              const offsetY = offsetInit - offsetDistance * rowCount;

              if (!(gridNo % colLimit)) {
                rowCount += 1;
                colCount = 0;
              }

              return (
                <React.Fragment key={i}>
                  <Rect
                    x={x}
                    y={y}
                    width={25}
                    height={25}
                    fill="red"
                    shadowBlur={5}
                  />
                  <Text
                    text={gridNo.toString()}
                    offsetX={offsetX}
                    offsetY={offsetY}
                  />
                </React.Fragment>
              );
            })}
          </Label>
        );
      });
      setCircleList([...circleListTemp]);
      setImageClickCoordList([...imageClickCoordList]);
      localStorage.setItem(
        'imageClickCoordList',
        JSON.stringify([...imageClickCoordList])
      );
    },
    [grid]
  );

  const handleZoomStage = (event: any) => {
    const scaleBy = 1.01;
    event.evt.preventDefault();
    if (stageRef.current !== null) {
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

  const handleClickLabel = (e: any) => {
    console.log('click label haha');
    console.log(e);
  };

  useEffect(() => {
    setStageWidth(window.innerWidth);
    setStageHeight(window.innerHeight * 0.5);
  }, []);

  return (
    <Stage
      style={{ backgroundColor: 'rgb(166, 162, 154)', overflow: 'hidden' }}
      width={stageWidth}
      height={stageHeight}
      draggable
      onWheel={handleZoomStage}
      ref={stageRef}
    >
      <Layer>
        <Group>
          <Images img={image} handleClickImage={() => {}} />
          {circleList.length > 0 && circleList.map((curCircle) => curCircle)}
        </Group>
      </Layer>
    </Stage>
  );
};

export default ImagePointGrid;
