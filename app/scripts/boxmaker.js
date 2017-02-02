import { norm } from './util/dimension';
import { toShape } from './util/path';
import Paper from './geom/paper';
import { Part, ROTATION } from './geom/part';

//const PaperScope = paper.
// Internal constants for making iterating over faces easier
const EDGE_SOLO = 0,
      EDGE_UNDER = 1,
      EDGE_OVER = 2

function fromPaperPath(path) {
  if (!(path.closed &&
        path.segments &&
        path.segments.length > 2)) {
    throw new Error('invalid path');
  }

  return path.segments.map((seg) => {
    return {
      x: seg.point.x,
      y: seg.point.y,
    }
  })
}

/* cfg consists of:
 * - dimL
 * - dimW
 * - dimH
 * - thickness
 * - toothWidth  (optional)
 */
export default function BoxMaker(cfg) {
  const ob = {
    dimW: norm(cfg.dimW),   // x
    dimH: norm(cfg.dimH),   // y
    dimL: norm(cfg.dimL),   // z
    thickness: norm(cfg.thickness),
    parts: [],
  };
  ob.toothWidth = norm(cfg.toothWidth) || ob.thickness*2

  /*
   * return an array containing the part config for each part in the
   * assembly. Each of these gets passed to the builder.
   *
   * normal: normal vec of the front plane of the sheet
   * origin: location in 3D assembly space for the part's origin (front face)
   * edges: looking at the front face, BRTL TRBL-ordered list of edge types
   */
  ob.partConfigs = function() {
    return [
      {
        id: 'face-front',
        width: ob.dimW,
        height: ob.dimH,
        rotation: ROTATION.FRONT,
        origin: [-ob.dimW/2, 0, ob.dimL/2],
        edges: [ EDGE_UNDER, EDGE_OVER, EDGE_SOLO, EDGE_OVER ],
      },
      {
        id: 'face-back',
        width: ob.dimW,
        height: ob.dimH,
        rotation: ROTATION.BACK,
        origin: [ob.dimW/2, 0, -ob.dimL/2],
        edges: [ EDGE_UNDER, EDGE_OVER, EDGE_SOLO, EDGE_OVER ],
      },
      {
        id: 'face-left',
        width: ob.dimL,
        height: ob.dimH,
        rotation: ROTATION.LEFT,
        origin: [-ob.dimW/2, 0, -ob.dimL/2],
        edges: [ EDGE_UNDER, EDGE_UNDER, EDGE_SOLO, EDGE_UNDER ],
      },
      {
        id: 'face-right',
        width: ob.dimL,
        height: ob.dimH,
        rotation: ROTATION.RIGHT,
        origin: [ob.dimW/2, 0, ob.dimL/2],
        edges: [ EDGE_UNDER, EDGE_UNDER, EDGE_SOLO, EDGE_UNDER ],
      },
      {
        id: 'face-bottom',
        width: ob.dimW,
        height: ob.dimL,
        rotation: ROTATION.BOTTOM,
        origin: [-ob.dimW/2, 0, -ob.dimL/2],
        edges: [ EDGE_OVER, EDGE_OVER, EDGE_OVER, EDGE_OVER ],
      },
    ]
  }

  ob.update = function() {
    ob.parts = ob.partConfigs().map(pc => ob.makePart(pc));
  }

  ob.makePart = function(pc) {
    const origFace = new Paper.Path.Rectangle({
      point: [0, 0],
      size: [pc.width, pc.height],
    })

    const teethFace = pc.edges.reduce((face, edgeType, i) => {
      const distance = (i % 2 === 0) ? pc.width : pc.height;
      const edgeTeeth = genTeethCutout(distance, edgeType);

      // TODO: matrix composition seems backwards?
      const edgeTransform = new Paper.Matrix()
        .translate(
          (i===1 || i===2) ? pc.width : 0,
          (i > 1)          ? pc.height: 0
        )
        .rotate(90*i, 0, 0);

      return edgeTeeth.reduce((face2, tooth) => {
        tooth.transform(edgeTransform);
        return face2.subtract(tooth);
      }, face)
    }, origFace);

    return Part({
      shape: toShape(teethFace),
      thickness: ob.thickness,
      rotation: pc.rotation,
      position: pc.origin,
    })
  }

  function genTeethCutout(distance, edgeType) {
    if (edgeType === EDGE_SOLO) return [];

    const numTeeth = Math.round(
      (distance/ob.toothWidth + 1) / 2
    ) * 2 - 1;

    const realWidth = distance / numTeeth;
    const startInd = (edgeType === EDGE_OVER) ? 0 : 1;

    const baseTooth = Paper.Path.Rectangle({
      point: [0, 0],
      size: [realWidth, ob.thickness],
    });

    const teeth = [];
    for (let i=startInd; i<numTeeth; i+=2) {
      const tooth = baseTooth.clone().translate(i*realWidth, 0);
      teeth.push(tooth);
    }
    return teeth;
  }

  ob.update();
  return ob;
}

