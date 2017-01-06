import Store from './store';
import BoxMaker from './boxmaker';
import * as ThreeOrbit from 'three/examples/js/controls/OrbitControls';

// Requires globals:
// addEventListener
// requestAnimationFrame

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
    amount: thickness
  });
}

function toThreeMatrix(matArray) {
  const m = new THREE.Matrix4();
  m.set(...matArray);
  return m;
}

/*
let material = new THREE.MeshPhongMaterial({
  color: 0x156289,
  emissive: 0x072534,
  side: THREE.DoubleSide,
  shading: THREE.FlatShading
});
**/

export default function ThreeView(cfg) {
  const ob = {
    boxCfg: Store.get(),
    el: undefined,
  };

  const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera( 75, 1, 1, 10000 ),
        renderer = new THREE.WebGLRenderer({ antialias: true });
  let frameReq;

  function threeRender() {
    frameReq = requestAnimationFrame(threeRender);
    renderer.render(scene, camera);
  }

  ob.setupScene = function() {
    const orbit = new THREE.OrbitControls(camera, renderer.domElement);
    orbit.enableZoom = false;

    const lights = [];
    lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
    lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
    lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

    lights[ 0 ].position.set( 0, 200, 0 );
    lights[ 1 ].position.set( 100, 200, 100 );
    lights[ 2 ].position.set( -100, -200, -100 );

    scene.add( lights[ 0 ] );
    scene.add( lights[ 1 ] );
    scene.add( lights[ 2 ] );
  }

  ob.attach = function(el) {
    if (ob.el && ob.el !== el) {
      //detach & cleanup
    }
    ob.el = el;
    ob.resize();
    el.innerHtml = '';
    el.appendChild(renderer.domElement);
  }

  ob.resize = function() {
    const width = ob.el.clientWidth,
          height = ob.el.clientHeight;

    camera.aspect = width/height;
    renderer.setSize(width, height);
  }

  let meshes = [];
  ob.render = function() {
    console.log("Rendering with config ", ob.boxCfg);
    const bom = BoxMaker(ob.boxCfg);

    // Remove old meshes
    scene.remove(...meshes);

    meshes = [0, 1, 2, 3, 4].map((i) => {
      const path = bom.makeFacePath(i);
      const geom = toThreeGeom(path, bom.thickness);
      const m = new THREE.Matrix4();
      m.set(...bom.transform3D(i));
      geom.applyMatrix(m);
      return new THREE.Mesh(geom);
    });
    scene.add(...meshes);

    if (typeof reqFrame !== 'undefined') {
      cancelAnimationFrame(reqFrame)
    }
    threeRender();  // kick off render cycle TODO: need to un-requestAnimationFrame?
  }

  camera.position.z = 20;

  renderer.setClearColor(0x000000, 1);

  if (cfg.el) {
    ob.attach(cfg.el);
  }

  //addEventListener('resize', ob.resize);

  ob.setupScene();

  Store.subscribe((state) => {
    ob.boxCfg = state;
    ob.render();
  });

  return ob;
}
