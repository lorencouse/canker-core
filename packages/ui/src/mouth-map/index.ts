export {
  MAPPED_SURFACES,
  SURFACE_GEOMETRY,
  SURFACE_PATHS,
  VIEWBOX_SIZE,
  isMappedSurface,
  surfaceToViewBox,
  viewBoxToSurface
} from './geometry';
export type { MappedSurface, SurfaceBBox, SurfaceGeometry } from './geometry';
export { MouthOutline, MOUTH_MAP_STYLES } from './outline';
export type { MouthOutlineProps } from './outline';
export { MouthMap } from './mouth-map';
export type { MouthMapProps, MouthMapSore } from './mouth-map';
export { MouthMapThumb } from './mouth-map-thumb';
export type { MouthMapThumbProps, MouthMapThumbSore } from './mouth-map-thumb';
export { MouthHeatmap } from './mouth-heatmap';
export type { MouthHeatmapProps, MouthHeatmapSore } from './mouth-heatmap';
