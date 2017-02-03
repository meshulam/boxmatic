import TWEEN from 'tween.js';

// Represents a 3D assembly in three.js
//

function toThreeGeom(part) {
  const shape = THREE.MM.svgToShape(part.shape.outline);
  shape.holes = part.shape.holes.map(THREE.MM.svgToShape);

  return new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: false,
    amount: part.thickness,
  })
    // Front face at z0, extruding toward -z
    .translate(0, 0, -part.thickness);
}

const EASING = TWEEN.Easing.Cubic.Out;

export default function Assembly(cfg) {
  const ob = {
    model: cfg.model,   // BoxMaker or a generator that conforms to its interface
    material: cfg.material.clone(),   // We may modify material params
    parent: cfg.parent,

    meshGroup: new THREE.Group(),
    bbox: new THREE.Box3(),
  }

  init();

  function init() {
    // Clean up old children, if any
    ob.meshGroup.children.forEach(ob.meshGroup.remove);

    ob.model.parts.map(part => {
      const geom = toThreeGeom(part),
            quat = new THREE.Quaternion(...part.rotation),
            pos = new THREE.Vector3(...part.position)

      const m = new THREE.Matrix4();
      m.makeRotationFromQuaternion(quat);
      m.setPosition(pos);
      geom.applyMatrix(m);

      geom.computeBoundingBox();
      ob.bbox.union(geom.boundingBox);

      const mesh = new THREE.Mesh(geom, ob.material);
      mesh.castShadow = true;
      //mesh.receiveShadow = true;

      ob.meshGroup.add(mesh);
    });
  }

  ob.fadeIn = function(ms = 1000, fromBBox) {
    if (ms && fromBBox) {
      const initialScale = fromBBox ?
        fromBBox.getSize().divide(ob.bbox.getSize()) :
        new THREE.Vector3(0.01, 0.01, 0.01);

      ob.meshGroup.scale.copy(initialScale);

      const tween = new TWEEN.Tween(ob.meshGroup.scale)
      .easing(EASING)
      .to({ x: 1, y: 1, z: 1 }, ms)
      .start();
    }

    ob.parent.add(ob.meshGroup);
  }

  ob.fadeOut = function() {
    ob.parent.remove(ob.meshGroup);
    return;
  }

  return ob;
}
