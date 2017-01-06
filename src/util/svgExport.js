import {toSvgPath, boundingBox} from './path';

const DEFAULT_SVG_STYLE = 'stroke="black" fill="none" stroke-width="0.02" ';

function toSvg(paths) {
  const elems = [];
  let maxX = 0,
      maxY = 0;

  paths.forEach(path => {
    let [minPt, maxPt] = boundingBox(path);
    maxX = Math.max(maxX, maxPt.x);
    maxY = Math.max(maxY, maxPt.y);

    elems.push(`<path d="${toSvgPath(path)}" />`);
  });

  return [
    `<svg viewBox="0 0 ${maxX} ${maxY}" ${DEFAULT_SVG_STYLE} >`,
      ...elems,
    `</svg>`
  ].join('');
}
