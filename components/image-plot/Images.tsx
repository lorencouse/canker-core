import type React from 'react';
import { useEffect, useRef } from 'react';
import type Konva from 'konva';
// Imported from the individual filter modules rather than the 'konva' root:
// the root resolves to konva/lib/index-node, which requires the native
// 'canvas' package. react-konva pulls in the browser build the same way.
import { Grayscale } from 'konva/lib/filters/Grayscale';
import { Invert } from 'konva/lib/filters/Invert';
import { Brighten } from 'konva/lib/filters/Brighten';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

import { useIsDark } from '@/utils/hooks/useIsDark';

interface ImagesProps {
  img: string;
  handleClickImage: (e: any) => void;
  stageWidth: number;
  stageHeight: number;
}

/**
 * The mouth diagram, drained to neutral so plotted sores are the only colour
 * on the map. This mirrors the .mouth-substrate CSS class used elsewhere, but
 * has to go through Konva's canvas filters, which require the node to be
 * cached before they take effect.
 */
const Images: React.FC<ImagesProps> = ({
  img,
  handleClickImage,
  stageWidth,
  stageHeight
}) => {
  const [image] = useImage(img);
  const isDark = useIsDark();
  const nodeRef = useRef<Konva.Image>(null);

  const scale = image
    ? Math.min(stageWidth / image.width, stageHeight / image.height)
    : 1;

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !image) return;
    node.cache();
    node.getLayer()?.batchDraw();
  }, [image, isDark, scale, stageWidth, stageHeight]);

  if (!image) return null;

  return (
    <KonvaImage
      ref={nodeRef}
      image={image}
      scaleX={scale}
      scaleY={scale}
      x={(stageWidth - image.width * scale) / 2}
      y={(stageHeight - image.height * scale) / 2}
      filters={isDark ? [Grayscale, Invert, Brighten] : [Grayscale, Brighten]}
      brightness={isDark ? -0.15 : 0.08}
      opacity={0.85}
      onClick={handleClickImage}
      onTap={handleClickImage}
    />
  );
};

export default Images;
