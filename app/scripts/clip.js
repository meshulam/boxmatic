import ClipperLib from '../vendor/clipper';
import {Pt} from './util/path';

// Number of discrete steps per real world unit (mm or inch)
export const SCALE_INTERNAL = 10000;

export default function ClipperWrapper() {
  const obj = {
    cpr: new ClipperLib.Clipper(),
  }

  obj.addSubject = function(paths, keepOpen) {
    const closed = !keepOpen;
    paths = obj._toInternalFormat(paths);
    obj.cpr.AddPaths(paths, ClipperLib.PolyType.ptSubject, closed);
  }

  obj.addClip = function(paths, keepOpen) {
    const closed = !keepOpen;
    paths = obj._toInternalFormat(paths);
    obj.cpr.AddPaths(paths, ClipperLib.PolyType.ptClip, closed);
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

    return obj._fromInternalFormat(out);
  }

  obj._toInternalFormat = function(path, returnSingle=false) {
    if (path[0] && typeof path[0].length !== 'undefined') {
      // We have an array of paths, so return an array of transformed paths
      return path.map(singlePath => obj._toInternalFormat(singlePath, true));
    }

    const internalPath = path.map(pt => {
      return { X: pt.x, Y: pt.y }
    });
    ClipperLib.JS.ScaleUpPath(internalPath, SCALE_INTERNAL);

    return returnSingle ? internalPath : [internalPath];
  }

  obj._fromInternalFormat = function(path) {
    if (path[0] && typeof path[0].length !== 'undefined') {
      // We have an array of paths, so return an array of transformed paths
      return path.map(obj._fromInternalFormat);
    }

    ClipperLib.JS.ScaleDownPath(path, SCALE_INTERNAL);
    return path.map(point => Pt(point.X, point.Y));
  }

  return obj;
}
