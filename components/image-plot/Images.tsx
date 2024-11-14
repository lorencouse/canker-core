import type React from 'react';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

interface ImagesProps {
  img: string;
  handleClickImage: (e: any) => void;
  stageWidth: number;
  stageHeight: number;
}

const Images: React.FC<ImagesProps> = ({
  img,
  handleClickImage,
  stageWidth,
  stageHeight,
}) => {
  const [image] = useImage(img);

  if (!image) return null;

  const scale = Math.min(stageWidth / image.width, stageHeight / image.height);

  return (
    <KonvaImage
      image={image}
      scaleX={scale}
      scaleY={scale}
      x={(stageWidth - image.width * scale) / 2}
      y={(stageHeight - image.height * scale) / 2}
      onClick={handleClickImage}
    />
  );
};

export default Images;
