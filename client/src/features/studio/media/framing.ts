export interface PortraitCrop {
  left: number;
  top: number;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export function cropForPortrait(
  width: number,
  height: number,
  targetAspect: number,
  centerX: number,
  centerY: number,
): PortraitCrop {
  const sourceWidth = Math.max(1, Math.floor(Number.isFinite(width) ? width : 1));
  const sourceHeight = Math.max(1, Math.floor(Number.isFinite(height) ? height : 1));
  const aspect = Number.isFinite(targetAspect) && targetAspect > 0 ? targetAspect : 9 / 16;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceWidth / sourceHeight > aspect) cropWidth = Math.round(sourceHeight * aspect);
  else cropHeight = Math.round(sourceWidth / aspect);
  cropWidth = clamp(cropWidth, 1, sourceWidth);
  cropHeight = clamp(cropHeight, 1, sourceHeight);
  const safeCenterX = clamp(Number.isFinite(centerX) ? centerX : 0.5, 0, 1);
  const safeCenterY = clamp(Number.isFinite(centerY) ? centerY : 0.5, 0, 1);
  const left = clamp(Math.round(safeCenterX * sourceWidth - cropWidth / 2), 0, sourceWidth - cropWidth);
  const top = clamp(Math.round(safeCenterY * sourceHeight - cropHeight / 2), 0, sourceHeight - cropHeight);
  return { left, top, width: cropWidth, height: cropHeight };
}

/**
 * Converts a source-space crop rectangle to CSS object-position fractions.
 * CSS percentages are relative to the overflow area, not the source position.
 */
export function objectPositionForPortraitCrop(
  width: number,
  height: number,
  targetAspect: number,
  centerX: number,
  centerY: number,
): { x: number; y: number } {
  const sourceWidth = Math.max(1, Math.floor(Number.isFinite(width) ? width : 1));
  const sourceHeight = Math.max(1, Math.floor(Number.isFinite(height) ? height : 1));
  const crop = cropForPortrait(sourceWidth, sourceHeight, targetAspect, centerX, centerY);
  const overflowX = sourceWidth - crop.width;
  const overflowY = sourceHeight - crop.height;
  return {
    x: overflowX > 0 ? clamp(crop.left / overflowX, 0, 1) : 0.5,
    y: overflowY > 0 ? clamp(crop.top / overflowY, 0, 1) : 0.5,
  };
}

export function portraitCropQuality(sourceWidth: number, sourceHeight: number, outputHeight: number) {
  const outputWidth = Math.round(outputHeight * 9 / 16);
  const crop = cropForPortrait(sourceWidth, sourceHeight, 9 / 16, 0.5, 0.5);
  const scale = Math.max(outputWidth / crop.width, outputHeight / crop.height);
  return { cropWidth: crop.width, cropHeight: crop.height, outputWidth, outputHeight, scale, isUpscaled: scale > 1.01 };
}
