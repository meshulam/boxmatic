import { norm } from './util/dimension';
import Shape from './geom/shape';
import { Part, ROTATION } from './geom/part';
import Pt from './geom/pt';
import Path from './geom/path';
import Rect from './geom/rect';
import Matrix2 from './geom/matrix2';

const EDGE_SOLO = 0,
      EDGE_UNDER = 1,
      EDGE_OVER = 2

export const HANDLES = {
  NONE: 0,
  FRONT: 1,
  SIDES: 2,
  ALL: 3,
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
    handles: cfg.handles || HANDLES.SIDES,
    fillet: cfg.fillet || 0,
    handleSize: Pt(110, 35)
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
        handle: ob.handles === HANDLES.FRONT || ob.handles === HANDLES.ALL,
      },
      {
        id: 'face-back',
        width: ob.dimW,
        height: ob.dimH,
        rotation: ROTATION.BACK,
        origin: [ob.dimW/2, 0, -ob.dimL/2],
        edges: [ EDGE_UNDER, EDGE_OVER, EDGE_SOLO, EDGE_OVER ],
        handle: ob.handles === HANDLES.ALL,
      },
      {
        id: 'face-left',
        width: ob.dimL,
        height: ob.dimH,
        rotation: ROTATION.LEFT,
        origin: [-ob.dimW/2, 0, -ob.dimL/2],
        edges: [ EDGE_UNDER, EDGE_UNDER, EDGE_SOLO, EDGE_UNDER ],
        handle: ob.handles === HANDLES.SIDES || ob.handles === HANDLES.ALL,
      },
      {
        id: 'face-right',
        width: ob.dimL,
        height: ob.dimH,
        rotation: ROTATION.RIGHT,
        origin: [ob.dimW/2, 0, ob.dimL/2],
        edges: [ EDGE_UNDER, EDGE_UNDER, EDGE_SOLO, EDGE_UNDER ],
        handle: ob.handles === HANDLES.SIDES || ob.handles === HANDLES.ALL,
      },
      {
        id: 'face-bottom',
        width: ob.dimW,
        height: ob.dimL,
        rotation: ROTATION.BOTTOM,
        origin: [-ob.dimW/2, 0, -ob.dimL/2],
        edges: [ EDGE_OVER, EDGE_OVER, EDGE_OVER, EDGE_OVER ],
        handle: false,
      },
    ]
  }

  ob.update = function() {
    ob.parts = ob.partConfigs().map(pc => ob.makePart(pc));
  }

  // Return a Paper Path for a hole to cut out from a part
  ob.handlePath = function(pc) {
    const radius = Math.min(ob.handleSize.x, ob.handleSize.y) / 2;

    return Rect(
      pc.width/2-ob.handleSize.x/2,   // centering in x
      pc.height-ob.thickness*1.5,     // start 1.5x thickness below the top
      ob.handleSize.x,
      -ob.handleSize.y,
      radius
    );
  }

  ob.makePart = function(pc) {
    const origFace = Rect(0, 0, pc.width, pc.height);

    let finishedFace = pc.edges.reduce((face, edgeType, i) => {
      const distance = (i % 2 === 0) ? pc.width : pc.height;
      const edgeTeeth = genTeethCutout(distance, edgeType);

      // TODO: matrix composition seems backwards?
      const edgeTransform = Matrix2()
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

    if (pc.handle &&
        (pc.width > ob.handleSize.x + 2*ob.thickness) &&
        (pc.height > ob.handleSize.y + 2*ob.thickness)) {

      finishedFace = finishedFace.subtract(ob.handlePath(pc));
    }

    if (ob.fillet > 0) {
      finishedFace = Path.fillet(finishedFace, ob.fillet);
    }

    return Part({
      shape: Shape.fromPath(finishedFace),
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

    const baseTooth = Rect(0, 0, realWidth, ob.thickness);

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

