import Paper from './paper';

export default function Rect(x, y, w, h, radius=0) {
  return new Paper.Path.Rectangle({
    point: [x, y],
    size: [w, h],
    radius: new Paper.Size(radius, radius)
  });
}
