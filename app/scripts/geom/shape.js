import Paper from './paper';
import Pt from './pt';

export default function Shape(cfg) {
  const ob = {
    outline: cfg.outline,
    holes: cfg.holes,
    point: cfg.point,
    size: cfg.size,
  }

  return ob;
}

// Converts a paper Path or CompoundPath
// into a BoxMatic shape, an object with fields:
// - outline: svg path string of shape outline
// - holes: array of svg path strings
// - point: [x, y]
// - size: [x, y]
Shape.fromPath = function(paperPath) {
  // TODO: is a compound path's outline always the first child?
  const [ outline, ...holes ] = paperPath.children ?
    // It's a compound path
    paperPath.children.map(path => path.getPathData()) :

    // It's a simple path
    [ paperPath.getPathData() ];

  const bbox = paperPath.bounds;

  return Shape({
    outline,
    holes,
    point: Pt(bbox.x, bbox.y),
    size: Pt(bbox.width, bbox.height),
  })
}
