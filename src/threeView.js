import TWEEN from 'tween.js';
import 'three/examples/js/controls/OrbitControls';

import Store from './store';
import BoxMaker from './boxmaker';
import * as DimUtil from './util/dimension';

const {
  Camera,
  Matrix4,
  Vector3,
} = THREE;

const TWEEN_DURATION = 1000;

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
    amount: thickness,
    material: 0,
    extrudeMaterial: 1,
  });
}

function toThreeMatrix(matArray) {
  const m = new THREE.Matrix4();
  m.set(...matArray);
  return m;
}

// How far away does the camera need to be to fully show the object?
// 
function cameraDollyTo(fov, l, w, h) {
  const radius = Math.sqrt(l*l + w*w + h*h) / 2;
  return Math.atan(fov/2) * radius;
}


export default function ThreeView(cfg) {
  const ob = {
    boxCfg: {},
    boxCfgNorm: {},   // copy of boxCfg with dimensions converted to normalized numbers
    el: undefined,
  };

  const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera( 75, 1, 1, 10000 ),
        cameraPosTween = new TWEEN.Tween(camera.position),
        cameraQuatTween = new TWEEN.Tween(camera.quaternion),
        renderer = new THREE.WebGLRenderer({ antialias: true }),
        faceMaterial = new THREE.MeshStandardMaterial({shading: THREE.FlatShading}),
        edgeMaterial = new THREE.MeshStandardMaterial({shading: THREE.FlatShading});
  let frameReq;

  function animate(time) {
    frameReq = requestAnimationFrame(animate);

    TWEEN.update();   // Update transition values
    renderer.render(scene, camera);
  }

  // Called when the store updates
  ob.updateState = function(state) {
    ob.boxCfg = state;

    ob.boxCfgNorm = Object.keys(state).reduce((acc, key) => {
      acc[key] = DimUtil.norm(state[key]) || state[key];
      return acc;
    }, {});

    ob.render();
  }

  ob.setupScene = function() {
    const orbit = new THREE.OrbitControls(camera, renderer.domElement);
    //orbit.enableZoom = false;

    camera.position.set(-20, 40, 80);
    camera.lookAt(new Vector3());

    const lights = [];
    lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
    lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
    lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

    lights[ 0 ].position.set( 0, 2000, 0 );
    lights[ 1 ].position.set( 1000, 2000, 1000 );
    lights[ 2 ].position.set( -1000, -2000, -1000 );

    scene.add( lights[ 0 ] );
    scene.add( lights[ 1 ] );
    scene.add( lights[ 2 ] );

    const loader = new THREE.TextureLoader();
    loader.load('img/birch-top.jpg', function(map) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      //map.anisotropy = 1;
      map.repeat.set(0.002, 0.002);
      faceMaterial.map = map;
      faceMaterial.needsUpdate = true;
    });

    loader.load('img/birch-edge.png', function(map) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(0.1, 0.1);
      edgeMaterial.map = map;
      //edgeMaterial.roughnessMap = map;
      //edgeMaterial.bumpMap = map;
      edgeMaterial.needsUpdate = true;
    })

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
    const cfg = ob.boxCfgNorm;
    console.log("Rendering with config ", cfg);
    const bom = BoxMaker(ob.boxCfg);

    // Remove old meshes
    scene.remove(...meshes);

    meshes = [0, 1, 2, 3, 4].map((i) => {
      const path = bom.makeFacePath(i);
      const geom = toThreeGeom(path, bom.thickness);
      const m = new THREE.Matrix4();
      m.set(...bom.transform3D(i));
      geom.applyMatrix(m);
      return new THREE.Mesh(geom, new THREE.MultiMaterial([faceMaterial, edgeMaterial]));
    });
    scene.add(...meshes);

    //camera.lookAt(new Vector3());
    const pos = camera.position.clone().setLength(
      1.5*cameraDollyTo(camera.fov, cfg.dimL, cfg.dimH, cfg.dimW)
    );
    cameraPosTween.to(pos, TWEEN_DURATION).start();

    if (typeof reqFrame !== 'undefined') {
      cancelAnimationFrame(reqFrame)
    }
    animate();  // kick off render cycle TODO: need to un-requestAnimationFrame?
  }

  renderer.setClearColor(0x000000, 1);

  if (cfg.el) {
    ob.attach(cfg.el);
  }

  //addEventListener('resize', ob.resize);

  ob.setupScene();

  // Kick off the initial render
  ob.updateState(Store.get());
  Store.subscribe(ob.updateState);

  return ob;
}
