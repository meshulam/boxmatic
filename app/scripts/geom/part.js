
// Shortcut for rotation literals
const iSq2 = Math.sqrt(2) / 2;

export const ROTATION = {
  FRONT: [0, 0, 0, 1],    // Identity
  BACK: [0, 1, 0, 0],
  LEFT: [0, -iSq2, 0, iSq2],
  RIGHT: [0, iSq2, 0, iSq2],
  TOP: [-iSq2, 0, 0, iSq2],
  BOTTOM: [iSq2, 0, 0, iSq2],
}

export function Part(cfg) {
  const ob = {
    shape: cfg.shape,
    thickness: cfg.thickness || 1,
    rotation: cfg.rotation || ROTATION.FRONT,
    position: cfg.position || [0, 0, 0],
  };

  return ob;
}
