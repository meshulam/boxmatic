
export function Pt(x, y) {
  return {
    x: x,
    y: y,
  }
}

function ptSubtract(a, b) {
  return {
    x: a.x-b.x,
    y: a.y-b.y,
  }
}

function ptAdd(a, b) {
  return {
    x: a.x+b.x,
    y: a.y+b.y,
  }
}

function ptScale(pt, factor) {
  return {
    x: pt.x*factor,
    y: pt.y*factor,
  }
}


// matrix is a 6-element array [a, b, d, e, xoff, yoff].
export function transform(path, matrix) {
  if (matrix.length !== 6) throw new Error("Matrix must be 6 elements");

  const [a, b, d, e, xoff, yoff] = matrix;

  return path.map(pt => {
    return {
      x: a*pt.x + b*pt.y + xoff,
      y: d*pt.x + e*pt.y + yoff,
    };
  });
}

// Use web-like coordinates (+y is down), so positive
// rotation is clockwise
export function rotate(path, angle, origin, use_radians=false) {
  if (!use_radians) {
    angle *= Math.PI/180;
  }

  let [rCos, rSin] = [Math.cos(angle), Math.sin(angle)];
  if (Math.abs(rCos) < 1e-10) rCos = 0;
  if (Math.abs(rSin) < 1e-10) rSin = 0;

  if (!origin) {    // Default to bbox center
    const {minPt, maxPt} = boundingBox(path);
    origin = {
      x: (minPt.x+maxPt.x)/2,
      y: (minPt.y+maxPt.y)/2,
    };
  }

  const matrix = [
    rCos, -rSin,
    rSin, rCos,
    origin.x - origin.x*rCos + origin.y*rSin,
    origin.y - origin.x*rSin - origin.y*rCos,
  ]

  return transform(path, matrix);
}

export function translate(path, xOff, yOff) {
  if (typeof yOff === 'undefined') {
    yOff = xOff.y;
    xOff = xOff.x;
  }

  const matrix = [
    1, 0,
    0, 1,
    xOff, yOff
  ];

  return transform(path, matrix);
}


export function boundingBox(path) {
  const {minPt, maxPt} = path.reduce((acc, pt) => {
    if (typeof acc.minPt.x !== 'number' || pt.x < acc.minPt.x) {
      acc.minPt.x = pt.x;
    }
    if (typeof acc.minPt.y !== 'number' || pt.y < acc.minPt.y) {
      acc.minPt.y = pt.y;
    }
    if (typeof acc.maxPt.x !== 'number' || pt.x > acc.maxPt.x) {
      acc.maxPt.x = pt.x;
    }
    if (typeof acc.maxPt.y !== 'number' || pt.y > acc.maxPt.y) {
      acc.maxPt.y = pt.y;
    }
    return acc;
  }, { minPt: {}, maxPt: {} });

  return [minPt, maxPt];
}

export function mergeBoundingBoxes(a, b) {
  return [
    {
      x: Math.min(a[0].x, b[0].x),
      y: Math.min(a[0].y, b[0].y),
    },
    {
      x: Math.max(a[1].x, b[1].x),
      y: Math.max(a[1].y, b[1].y),
    },
  ]
}

export function makeBox(width, height, xOff=0, yOff=0) {
  return [
    { x: xOff,       y: yOff },
    { x: xOff+width, y: yOff },
    { x: xOff+width, y: yOff+height },
    { x: xOff,       y: yOff+height },
  ]
}


export function toSvgPath(path, scale) {
  let svgpath = "";

  if (!scale) scale = 1;
  path.forEach((pt, i) => {
    const command = (i === 0) ? "M" : "L";
    svgpath += `${command}${pt.x / scale},${pt.y / scale} `;
  });
  svgpath += "Z";

  return svgpath;
}
