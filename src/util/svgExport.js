import {toSvgPath, boundingBox, mergeBoundingBoxes} from './path';

const DEFAULT_SVG_STYLE = 'stroke="black" fill="none" stroke-width="1" ';
const MARGIN = 20;

export function toSvg(paths) {
  const bbox = paths
                 .map(boundingBox)
                 .reduce(mergeBoundingBoxes);

  bbox[0].x -= MARGIN;
  bbox[0].y -= MARGIN;
  bbox[1].x += MARGIN;
  bbox[1].y += MARGIN;

  const width = bbox[1].x - bbox[0].x;
  const height = bbox[1].y - bbox[0].y;

  const elems = paths.map(path => {
    return `<path d="${toSvgPath(path)}" />`;
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg"
        viewBox="${bbox[0].x} ${bbox[0].y} ${width} ${height}"
        width="${width}mm" height="${height}mm" ${DEFAULT_SVG_STYLE} >`,
      ...elems,
    `</svg>`
  ].join('');
}
