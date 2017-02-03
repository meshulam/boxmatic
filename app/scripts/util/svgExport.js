import Pt from '../geom/pt';

const DEFAULT_SVG_STYLE = 'stroke="black" fill="none" stroke-width="1" ';
const MARGIN = 20;


export function layoutSvg(shapes, maxWidth=500) {
  const size = Pt(0, 0);
  const cursor = Pt(MARGIN, MARGIN);

  function layoutShape(shape) {
    console.log(shape.point)
    const svgStr = [
      `<g transform="translate(${cursor.x-shape.point.x} ${cursor.y-shape.point.y})">`,
        `<path d="${shape.outline}" />`,
        ...shape.holes.map(p => `<path d="${p}" />`),
      `</g>`
    ].join('');

    // Expand dimensions if necessary
    size.x = Math.max(size.x, cursor.x+shape.size.x)
    size.y = Math.max(size.y, cursor.y+shape.size.y)

    // Layout strategy (just a row now)
    cursor.x += (shape.size.x + MARGIN);

    return svgStr;
  }

  const elems = shapes.map(layoutShape);

  // Add bottom/right margin after everything's laid out
  size.x += MARGIN;
  size.y += MARGIN;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${size.x} ${size.y}"
        width="${size.x}mm" height="${size.y}mm" ${DEFAULT_SVG_STYLE} >`,
      ...elems,
    `</svg>`
  ].join('');
}
