import test, { doubleEq } from './base';

import BoxMaker from '../../app/scripts/boxmaker';
import * as Path from '../../app/scripts/util/path';

const FACE_FRONT = 0; // TODO: export these

import Paper from '../../app/scripts/geom/paper';
test('matrixtest', function(t) {
  const rot90 = new Paper.Matrix().rotate(90, 0, 0);

  const trans50x = new Paper.Matrix().translate(50, 0);

  const pt = new Paper.Point(10, 20);

  const rPt = rot90.transform(pt.clone());
  const tPt = trans50x.transform(pt.clone());

  t.test('rotate', function(t) {
    t.ok(doubleEq(rPt.x, -20))
    t.ok(doubleEq(rPt.y, 10));
    t.end();
  });

  t.test('translate', function(t) {
    t.equal(tPt.x, 60);
    t.equal(tPt.y, 20);
    t.end();
  });

  t.test('composed', function(t) {

    const rotTrans = rot90.clone().prepend(trans50x);
    const transRot = trans50x.clone().prepend(rot90);

    const rtPt = rotTrans.transform(pt.clone());
    const trPt = transRot.transform(pt.clone());

    t.equal(rtPt.x, 30);
    t.equal(rtPt.y, 10);

    t.equal(trPt.x, -20);
    t.equal(trPt.y, 60);

    t.end();
  });

  t.end();
});

test('BoxMaker', function(t) {
  function makeBox() {
    return BoxMaker({
      dimL: {value: 50, unit: 'mm'},
      dimW: {value: 40, unit: 'mm'},
      dimH: {value: 30, unit: 'mm'},
      thickness: {value: 2, unit: 'mm'},
      toothWidth: 4,
    });
  }

  t.test('makeFacePath - front', function(t) {
    const bm = makeBox();
    const path = bm.makeFacePath(FACE_FRONT);
    const box = Path.boundingBox(path);

    const width = box[1].x - box[0].x;
    const height = box[1].y - box[0].y;
    t.equal(width, 40);
    t.equal(height, 30);

    t.equal(path.length, 48);
    t.end();
  });


});
