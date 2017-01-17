// Represents a 3D assembly in three.js
//
//

function toThreeGeom(path, thickness) {
  const shape = new THREE.Shape();
  let started = false;
  path.forEach(pt => {
    if (!started) {
      shape.moveTo(pt.x, pt.y);
      started = true;
    } else {
      shape.lineTo(pt.x, pt.y);
    }
  });
  shape.lineTo(path[0].x, path[0].y);

  return new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: false,
    amount: thickness,
    material: 0,
    extrudeMaterial: 1,
  });
}

export default function Assembly(cfg) {
  const ob = {
    model: cfg.model,   // BoxMaker or a generator that conforms to its interface
    material: cfg.material,
    meshGroup: new THREE.Group(),
    bbox: new THREE.Box3(),
  }

  init();

  function init() {
    // Clean up old children, if any
    ob.meshGroup.children.forEach(ob.meshGroup.remove);

    [...Array(5).keys()].forEach((i) => {

      const path = ob.model.makeFacePath(i),
            geom = toThreeGeom(path, ob.model.thickness);

      const m = new THREE.Matrix4();
      m.set(...ob.model.transform3D(i));
      geom.applyMatrix(m);

      geom.computeBoundingBox();
      ob.bbox.union(geom.boundingBox);

      const mesh = new THREE.Mesh(geom, ob.material);
      mesh.castShadow = true;
      //mesh.receiveShadow = true;

      ob.meshGroup.add(mesh);
    });
  }
  console.log(ob.bbox);

  return ob;
}
