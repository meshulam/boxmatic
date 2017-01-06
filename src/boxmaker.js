import ClipperWrapper from './clip';
import * as Path from './util/path';
import { norm } from './util/dimension';

// Internal constants for making iterating over faces easier
const EDGE_SOLO = 0,
      EDGE_UNDER = 1,
      EDGE_OVER = 2

export const FACE_FRONT = 0,
      FACE_BACK = 1,
      FACE_LEFT = 2,
      FACE_RIGHT = 3,
      FACE_BOTTOM = 4,
      FACE_TOP = 5

/* cfg consists of:
 * - dimL
 * - dimW
 * - dimH
 * - thickness
 * - toothWidth  (optional)
 */
export default function BoxMaker(cfg) {
  const ob = {
    dimL: norm(cfg.dimL),
    dimW: norm(cfg.dimW),
    dimH: norm(cfg.dimH),
    thickness: norm(cfg.thickness),
  };
  ob.toothWidth = norm(cfg.toothWidth) || ob.thickness*2

  /*
   * 'edges' is an array of four EDGE_* constant values, corresponding
   * to the bottom, right, top, left edges of this face.
   */
  function makeFaceInternal(width, height, edges) {
    let facePath = [Path.makeBox(width, height)];

    edges.forEach((edgeType, i) => {
      const clippy = ClipperWrapper();
      clippy.addSubject(facePath);

      let translation = Path.Pt(0, 0);
      if (i===1 || i === 2) {
        translation.x = width;
      }
      if (i > 1) {
        translation.y = height;
      }

      const distance = (i % 2 === 0) ? width : height;

      let teeth = genTeethCutout(distance, edgeType);
      teeth.forEach(tooth => {
        let out = Path.rotate(tooth, 90*i, Path.Pt(0, 0));
        out = Path.translate(out, translation);
        clippy.addClip(out);
      });
      facePath = clippy.difference();
    });

    // TODO: Check that we get just one path for each face
    return facePath[0];
  }

  function genTeethCutout(distance, edgeType) {
    if (edgeType === EDGE_SOLO) return [];

    const numTeeth = Math.round(
      (distance/ob.toothWidth + 1) / 2
    ) * 2 - 1;

    const realWidth = distance / numTeeth;

    const startInd = (edgeType === EDGE_OVER) ? 0 : 1;

    const baseTooth = Path.makeBox(realWidth, ob.thickness);

    const teeth = [];
    for (let i=startInd; i<numTeeth; i+=2) {
      teeth.push(Path.translate(baseTooth, i*realWidth, 0));
    }
    return teeth;
  }

  ob.makeFaces = function() {
    return [0, 1, 2, 3, 4]
      .map(i => {
        const path = ob.makeFacePath(i);
        return Path.transform(path, ob.transform2D(i));
      });
  }

  ob.makeFacePath = function(ind) {
    if (ind < 2)    // Front/back face
      return makeFaceInternal(ob.dimW, ob.dimH,
        [EDGE_UNDER, EDGE_OVER, EDGE_SOLO, EDGE_OVER]);

    if (ind < 4)    // Left/right face
      return makeFaceInternal(ob.dimL, ob.dimH,
        [EDGE_UNDER, EDGE_UNDER, EDGE_SOLO, EDGE_UNDER]);

    if (ind < 5)    // Bottom face
      return makeFaceInternal(ob.dimW, ob.dimL,
        [EDGE_OVER, EDGE_OVER, EDGE_OVER, EDGE_OVER]);

    throw new Error("Face ID out of range: " + ind);
  }

  // Returns a 6-element transform matrix for laying out
  // the given part on a sheet.
  // Layout each pair of parts on a row:
  //  [Front] [Back]
  //  [Left] [Right]
  //  [Bottom]
  ob.transform2D = function(ind, spacing=ob.thickness*2) {
    let xOff, yOff;
    switch (ind) {
      case FACE_FRONT:
        xOff = spacing;
        yOff = spacing;
        break;
      case FACE_BACK:
        xOff = 2*spacing + ob.dimW;
        yOff = spacing;
        break;
      case FACE_LEFT:
        xOff = spacing;
        yOff = 2*spacing + ob.dimH;
        break;
      case FACE_RIGHT:
        xOff = 2*spacing + ob.dimL;
        yOff = 2*spacing + ob.dimH;
        break;
      case FACE_BOTTOM:
        xOff = spacing;
        yOff = 3*spacing + 2*ob.dimH;
        break;
      case FACE_TOP:
        xOff = 2*spacing + ob.dimW;
        yOff = 3*spacing + 2*ob.dimH;
        break;
    }

    return [
      1, 0,
      0, 1,
      xOff, yOff
    ];
  }

  ob.transform3D = function(ind) {
    const xOff = -ob.dimW/2,
          yOff = -ob.dimH/2,
          zOff = ob.dimL/2

    switch (ind) {
      case FACE_FRONT:
        return [
          1, 0, 0, xOff,
          0, 1, 0, yOff,
          0, 0, 1, zOff-ob.thickness
        ];
      case FACE_BACK:
        return [
          1, 0, 0, xOff,
          0, 1, 0, yOff,
          0, 0, 1, zOff-ob.dimL
        ];
      case FACE_LEFT:
        return [
          0, 0, 1, xOff,
          0, 1, 0, yOff,
         -1, 0, 0, zOff
        ];
      case FACE_RIGHT:
        return [
          0, 0, 1, xOff+ob.dimW-ob.thickness,
          0, 1, 0, yOff,
         -1, 0, 0, zOff
        ];
      case FACE_BOTTOM:
        return [
          1, 0, 0, xOff,
          0, 0, 1, yOff,
          0, -1, 0, zOff
        ];
      default:
        throw new Error(`Unknown index: ${ind}`);
    }
  }

  return ob;
}

