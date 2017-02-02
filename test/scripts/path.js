import test from './base';

import Paper from '../../app/scripts/geom/paper';
import * as Path from '../../app/scripts/util/path';

test('toShape', function(t) {
  t.test('simple path', function(t) {
    const rect = new Paper.Path.Rectangle({
      point: [0, 0],
      size: [40, 50],
    });

    const part = Path.toShape(rect);
    t.equal(part.outline, "M0,50l0,-50l40,0l0,50z");
    t.deepEqual(part.holes, []);

    t.end();
  });

  t.test('path with hole', function(t) {
    const rect = new Paper.Path.Rectangle({
      point: [0, 0],
      size: [40, 50],
    });
    const hole = new Paper.Path.Rectangle({
      point: [5, 5],
      size: [10, 10],
    });

    const compoundPath = rect.subtract(hole);

    const part = Path.toShape(compoundPath);
    t.deepEqual(part, {
      outline: "M0,50l0,-50l40,0l0,50z",
      holes: [ "M15,15l0,-10l-10,0l0,10z"],
    });

    t.end();
  });
});


