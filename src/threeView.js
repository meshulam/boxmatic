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

// Physical material settings for wood
const MATERIAL_WOOD = {
  metalness: 0,
  roughness: 0.85,
};
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

function CustomPointLight() {
  const light = new THREE.SpotLight(0xffffff);
  light.angle = Math.PI/6;
  light.penumbra = 0.2;
  light.power = 40;
  light.distance = 4000;
  light.decay = 2;
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  //light.shadow.camera.near = 50;
  light.shadow.camera.far = 5000;
  light.shadow.camera.fov = 30;
  //light.shadow.bias = 0.01;

  return light;
}


export default function ThreeView(cfg) {
  const ob = {
    boxCfg: {},
    boxCfgNorm: {},   // copy of boxCfg with dimensions converted to normalized numbers
    el: undefined,
  };

  const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera( 75, 1, 1, 10000 ),
        cameraPosTween = new TWEEN.Tween(camera.position).easing(TWEEN.Easing.Exponential.Out),
        cameraQuatTween = new TWEEN.Tween(camera.quaternion),
        renderer = new THREE.WebGLRenderer({ antialias: true }),
        faceMaterial = new THREE.MeshStandardMaterial(MATERIAL_WOOD),
        edgeMaterial = new THREE.MeshStandardMaterial(MATERIAL_WOOD);
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
    renderer.setClearColor(0x444444, 1);
    renderer.toneMappingExposure = 0.5;
    //renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const orbit = new THREE.OrbitControls(camera, renderer.domElement);
    //orbit.enableZoom = false;

    camera.position.set(-20, 40, 80);
    camera.lookAt(new Vector3());

    const l1 = CustomPointLight(),
          l2 = CustomPointLight(),
          lAmbient = new THREE.AmbientLight(0xddeeff, 0.75);

    l1.position.set(1000, 2000, -1000);
    l2.position.set(-2000, 2000, -100);

    scene.add(l1, l2, lAmbient);

    const h1 = new THREE.CameraHelper(l1.shadow.camera);
    const h2 = new THREE.CameraHelper(l2.shadow.camera);
    scene.add(h1, h2)

    const loader = new THREE.TextureLoader();
    loader.load('img/birch-top.png', function(map) {
      const scaling = 1/512 * 4;  // 2px per mm on a 512x512 image
      map.repeat.set(scaling, scaling);
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      faceMaterial.map = map;
      faceMaterial.bumpMap = map;
      faceMaterial.bumpScale = 0.3;
      faceMaterial.needsUpdate = true;
    });

    loader.load('img/birch-edge.png', function(map) {
      const scaling = 1/64 * 4;   // 4 px per mm on a 64x64 image
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(scaling, scaling);
      map.anisotropy = 4;
      edgeMaterial.map = map;
      edgeMaterial.needsUpdate = true;
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2000, 2000),
      faceMaterial
    );
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI/2;
    floor.position.y = -250;
    scene.add(floor);

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
      const mesh = new THREE.Mesh(geom, new THREE.MultiMaterial([faceMaterial, edgeMaterial]));
      mesh.castShadow = true;
      //mesh.receiveShadow = true;
      return mesh;
    });
    scene.add(...meshes);

    //camera.lookAt(new Vector3());
    const pos = camera.position.clone().setLength(
      1.1*cameraDollyTo(camera.fov, cfg.dimL, cfg.dimH, cfg.dimW)
    );
    cameraPosTween.to(pos, TWEEN_DURATION).start();

    if (typeof reqFrame !== 'undefined') {
      cancelAnimationFrame(reqFrame)
    }
    animate();  // kick off render cycle TODO: need to un-requestAnimationFrame?
  }


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
