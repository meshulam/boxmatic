

// Number of discrete steps per real world unit (mm or inch)
const SCALE_INTERNAL = 10000;

// Internal constants for making iterating over faces easier
const EDGE_SOLO = 0,
      EDGE_UNDER = 1,
      EDGE_OVER = 2,
      FACE_FRONT = 0,
      FACE_BACK = 1,
      FACE_LEFT = 2,
      FACE_RIGHT = 3,
      FACE_BOTTOM = 4,
      FACE_TOP = 5

function Pt(x, y) {
  return {
    X: x,
    Y: y,
  }
}

function boundingBox(path) {
  const {minPt, maxPt} = path.reduce((acc, pt) => {
    if (typeof acc.minPt.X !== 'number' || pt.X < acc.minPt.X) {
      acc.minPt.X = pt.X;
    }
    if (typeof acc.minPt.Y !== 'number' || pt.Y < acc.minPt.Y) {
      acc.minPt.Y = pt.Y;
    }
    if (typeof acc.maxPt.X !== 'number' || pt.X > acc.maxPt.X) {
      acc.maxPt.X = pt.X;
    }
    if (typeof acc.maxPt.Y !== 'number' || pt.Y > acc.maxPt.Y) {
      acc.maxPt.Y = pt.Y;
    }
    return acc;
  }, { minPt: {}, maxPt: {} });

  return [minPt, maxPt];
}

function ptSubtract(a, b) {
  return {
    X: a.X-b.X,
    Y: a.Y-b.Y,
  }
}

function ptAdd(a, b) {
  return {
    X: a.X+b.X,
    Y: a.Y+b.Y,
  }
}

function ptScale(pt, factor) {
  return {
    X: pt.X*factor,
    Y: pt.Y*factor,
  }
}

// matrix is a 6-element array [a, b, d, e, xoff, yoff].
function transform(path, matrix) {
  if (matrix.length !== 6) throw new Error("Matrix must be 6 elements");

  const [a, b, d, e, xoff, yoff] = matrix;

  return path.map(pt => {
    return {
      X: a*pt.X + b*pt.Y + xoff,
      Y: d*pt.X + e*pt.Y + yoff,
    };
  });
}

// Use web-like coordinates (+y is down), so positive
// rotation is clockwise
function rotate(path, angle, origin, use_radians) {
  if (!use_radians) {
    angle *= Math.PI/180;
  }

  let [rCos, rSin] = [Math.cos(angle), Math.sin(angle)];
  if (Math.abs(rCos) < 1e-10) rCos = 0;
  if (Math.abs(rSin) < 1e-10) rSin = 0;

  if (!origin) {    // Default to bbox center
    const {minPt, maxPt} = boundingBox(path);
    origin = {
      X: (minPt.X+maxPt.X)/2,
      Y: (minPt.X+maxPt.X)/2,
    };
  }

  const matrix = [
    rCos, -rSin,
    rSin, rCos,
    origin.X - origin.X*rCos + origin.Y*rSin,
    origin.Y - origin.X*rSin - origin.Y*rCos,
  ]

  return transform(path, matrix);
}

function translate(path, xOff, yOff) {
  if (typeof yOff === 'undefined') {
    yOff = xOff.Y;
    xOff = xOff.X;
  }

  const matrix = [
    1, 0,
    0, 1,
    xOff, yOff
  ];

  return transform(path, matrix);
}

function Box(left, bottom, right, top) {
  return [
    { X: left, Y: bottom },
    { X: right, Y: bottom },
    { X: right, Y: top },
    { X: left, Y: top },
  ]
}

const DEFAULT_SVG_STYLE = 'stroke="black" fill="none" stroke-width="0.02" ';
function toSvg(paths) {
  let elems = `<svg width="100%" height="100%" viewBox="-.1 -.1 12.1 12.1" ${DEFAULT_SVG_STYLE} >`;

  paths.forEach(path => {
    elems += `<path d="${toSvgPath(path)}" />`;
  });
  elems += '</svg>';
  return elems;
}

function toSvgPath(path, scale) {
  let svgpath = "";

  if (!scale) scale = 1;
  path.forEach((pt, i) => {
    const command = (i === 0) ? "M" : "L";
    svgpath += `${command}${pt.X / scale},${pt.Y / scale} `;
  });
  svgpath += "Z";

  return svgpath;
}

function ClipperWrapped() {
  const obj = {
    scale: SCALE_INTERNAL || 10000,
    cpr: new ClipperLib.Clipper(),
  }

  obj.addSubject = function(paths, keepOpen) {
    const closed = !keepOpen;
    if (paths && paths[0] && paths[0].length) {
      ClipperLib.JS.ScaleUpPaths(paths, obj.scale);
      obj.cpr.AddPaths(paths, ClipperLib.PolyType.ptSubject, closed);
    } else {
      ClipperLib.JS.ScaleUpPath(paths, obj.scale);
      obj.cpr.AddPath(paths, ClipperLib.PolyType.ptSubject, closed);
    }
  }

  obj.addClip = function(paths, keepOpen) {
    const closed = !keepOpen;
    if (paths && paths[0] && paths[0].length) {
      ClipperLib.JS.ScaleUpPaths(paths, obj.scale);
      obj.cpr.AddPaths(paths, ClipperLib.PolyType.ptClip, closed);
    } else {
      ClipperLib.JS.ScaleUpPath(paths, obj.scale);
      obj.cpr.AddPath(paths, ClipperLib.PolyType.ptClip, closed);
    }
  }

  obj.intersection = function() {
    return obj.doClip(ClipperLib.ClipType.ctIntersection);
  }
  obj.union = function() {
    return obj.doClip(ClipperLib.ClipType.ctUnion);
  }
  obj.difference = function() {
    return obj.doClip(ClipperLib.ClipType.ctDifference);
  }
  obj.xor = function() {
    return obj.doClip(ClipperLib.ClipType.ctXor);
  }

  obj.doClip = function(clipType) {
    const out = [];
    const success = obj.cpr.Execute(
      clipType,
      out,
      ClipperLib.PolyFillType.pftEvenOdd,
      ClipperLib.PolyFillType.pftEvenOdd
    );

    if (!success) {
      console.warn("Unsuccessful intersect!");
    }

    ClipperLib.JS.ScaleDownPaths(out, obj.scale);
    return out;
  }

  return obj;
}

/* cfg consists of:
 * - dimL
 * - dimW
 * - dimH
 * - thickness
 * - toothWidth  (optional)
 */
function BoxMaker(cfg) {
  const ob = {
    dimL: cfg.dimL,
    dimW: cfg.dimW,
    dimH: cfg.dimH,
    thickness: cfg.thickness,
    toothWidth: cfg.toothWidth || cfg.thickness * 2
  };

  /*
   * 'edges' is an array of four EDGE_* constant values, corresponding
   * to the bottom, right, top, left edges of this face.
   */
  function makeFaceInternal(width, height, edges) {
    let facePath = Box(0, 0, width, height);

    edges.forEach((edgeType, i) => {
      const clippy = ClipperWrapped();
      clippy.addSubject(facePath);

      let translation = Pt(0, 0);
      if (i===1 || i === 2) {
        translation.X = width;
      }
      if (i > 1) {
        translation.Y = height;
      }

      const distance = (i % 2 === 0) ? width : height;

      let teeth = genTeethCutout(distance, edgeType);
      teeth.forEach(tooth => {
        let out = rotate(tooth, 90*i, Pt(0, 0));
        out = translate(out, translation);
        clippy.addClip(out);
      });
      facePath = clippy.difference();
    });

    return facePath;
  }

  function genTeethCutout(distance, edgeType) {
    if (edgeType === EDGE_SOLO) return [];

    const numTeeth = Math.round(
      (distance/ob.toothWidth + 1) / 2
    ) * 2 - 1;

    const realWidth = distance / numTeeth;

    const startInd = (edgeType === EDGE_OVER) ? 0 : 1;

    const baseTooth = Box(0, 0, realWidth, ob.thickness);

    const teeth = [];
    for (let i=startInd; i<numTeeth; i+=2) {
      teeth.push(translate(baseTooth, i*realWidth, 0));
    }
    return teeth;
  }

  ob.makeFaces = function() {
    return [0, 1, 2, 3, 4]
      .map(i => ob.makeFace(i)[0]);   // TODO: Check that we get just one path for each face
  }

  ob.makeFace = function(ind) {
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

  return ob;
}

let cfg = {
  dimL: 10,
  dimW: 12,
  dimH: 8,
  thickness: 0.5,
}

const bom = BoxMaker(cfg);

const out = bom.makeFace(4);
const sv = toSvg(out);
document.body.innerHTML += sv;
