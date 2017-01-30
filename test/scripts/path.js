import test from './base';

import * as Path from '../../app/scripts/util/path';

test('Point', function(t) {
  t.test('arithmetic', function(t) {
    const a = Path.Pt(15, 22);
    const b = Path.Pt(10, 2);

    const aMinusB = Path.ptSubtract(a, b);
    t.equal(aMinusB.x, 5);
    t.equal(aMinusB.y, 20);

    const aPlusB = Path.ptAdd(a, b);
    t.equal(aPlusB.x, 25);
    t.equal(aPlusB.y, 24);
    t.end();
  });
});

