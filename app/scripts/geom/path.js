import Paper from './paper';

export default function Path() {

}

/**
 * Apply dogbone fillets to internal corners.
 * @param inside {boolean} - if true, treat the path as a hole
 *    and apply fillets to the inside of the shape.
 */
Path.fillet = function(inPath, radius, isHole=false, maxAngle=120) {
  if (inPath.children) {
    throw new Error("Can't fillet compound path");
  }

  let path = inPath.clone();
  path.clockwise = isHole;

  const fillets = [];

  path.segments.forEach(seg => {
    if (seg.hasHandles()) return;

    const {angle, bisect} = segmentAngle(seg, isHole);

    if (angle > 0 && angle < maxAngle) {
      fillets.push({
        angle,
        bisect,
        corner: seg.point,
      });
    }
  });

  fillets.forEach(fillet => {
    console.log('cutting out fillet', fillet);
    const center = fillet.corner.add(fillet.bisect.normalize(radius));
    const circ = new Paper.Path.Circle(center, radius);

    path = path.subtract(circ);
  });

  return path;
}

export function segmentAngle(seg, reverse) {
  const prevDir = seg.previous.point.subtract(seg.point).normalize();
  const nextDir = seg.next.point.subtract(seg.point).normalize();

  const ang = prevDir.getDirectedAngle(nextDir);

  return {
    angle: reverse ? ang : -ang,
    bisect: prevDir.rotate(ang/2),
  }
}
