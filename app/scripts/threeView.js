import TWEEN from 'tween.js';
import OrbitControls from './three/orbitControls';
import CheckerPlane from './three/checkerPlane';
import Assembly from './three/assembly';
import './three/polyfills';

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

// How far away does the camera need to be to fully show the object?
function cameraDollyTo(fov, l, w, h) {
  const radius = Math.sqrt(l*l + w*w + h*h) / 2;
  const angle = fov/2 * Math.PI / 180;
  return radius / Math.sin(angle);
}

function CustomPointLight() {
  const light = new THREE.SpotLight(0xffffff);
  light.angle = Math.PI/6;
  light.penumbra = 0.0;
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
    el: undefined,
  };

  const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(50, 1, 1, 10000),
        cameraPosTween = new TWEEN.Tween(camera.position)
          .easing(TWEEN.Easing.Cubic.Out),
        renderer = new THREE.WebGLRenderer({ antialias: true }),
        faceMaterial = new THREE.MeshStandardMaterial(MATERIAL_WOOD),
        edgeMaterial = new THREE.MeshStandardMaterial(MATERIAL_WOOD),
        woodMaterial = new THREE.MultiMaterial([faceMaterial, edgeMaterial]);
  let orbitController;
  let needsRender = true;
  let frameReq;

  function animate(time) {
    frameReq = window.requestAnimationFrame(animate);

    TWEEN.update(time);   // Update transition values
    if (needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  }

  ob.setupScene = function() {
    scene.fog = new THREE.Fog(0xAAAAAA, 2000, 10000);
    renderer.setClearColor(0x303030, 1);
    renderer.toneMappingExposure = 0.5;
    //renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    orbitController = new OrbitControls(camera, renderer.domElement);
    orbitController.addEventListener('change', () => {
      needsRender = true;
    });
    orbitController.enableZoom = false;
    orbitController.enablePan = false;

    cameraPosTween.onUpdate(() => {
      orbitController.update();   // Needs to know about new camera pos
      needsRender = true;
    });

    const origin = new Vector3();

    camera.position.set(400, 800, 800);
    camera.lookAt(origin);

    const l1 = CustomPointLight(),
          l2 = CustomPointLight(),
          lAmbient = new THREE.AmbientLight(0xddeeff, 0.75);

    l1.position.set(1000, 2000, 1000);
    l1.lookAt(origin);
    l2.position.set(-2000, 2000, 500);
    l2.lookAt(origin);

    scene.add(l1, l2, lAmbient);

    const h1 = new THREE.CameraHelper(l1.shadow.camera);
    const h2 = new THREE.CameraHelper(l2.shadow.camera);
    //scene.add(h1, h2)

    // Display the scene when textures are loaded
    THREE.DefaultLoadingManager.onLoad = function() {
      // Kick off the initial render
      ob.updateGeometry(Store.get());

      renderer.domElement.style.opacity = 1;
      needsRender = true;
    }

    const loader = new THREE.TextureLoader();
    loader.load('images/birch-top.png', function(map) {
      const scaling = 1/512 * 4;  // 2px per mm on a 512x512 image
      map.repeat.set(scaling, scaling);
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      faceMaterial.map = map;
      faceMaterial.bumpMap = map;
      faceMaterial.bumpScale = 0.3;
      faceMaterial.needsUpdate = true;
    });

    loader.load('images/birch-edge.png', function(map) {
      const scaling = 1/64 * 4;   // 4 px per mm on a 64x64 image
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(scaling, scaling);
      map.anisotropy = 4;
      edgeMaterial.map = map;
      edgeMaterial.needsUpdate = true;
    });

    const floor = CheckerPlane({
      width: 2000,
      height: 2000,
      tileSize: 200,
      colorA: '#005F79',
      colorB: '#d0d0d0',
    });
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI/2;
    //floor.position.y = -250;
    scene.add(floor);
  }

  ob.attach = function(el) {
    if (ob.el && ob.el !== el) {
      // TODO: detach & cleanup
    }
    ob.el = el;
    renderer.domElement.style.opacity = 0;  // Gets enabled when loaded
    el.appendChild(renderer.domElement);
    ob.resize();
  }

  ob.resize = function() {
    const width = ob.el.clientWidth,
          height = ob.el.clientHeight;

    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    needsRender = true;
  }

  let assembly;

  ob.updateGeometry = function(state) {
    const cfg = DimUtil.normalizeDimensions(state);
    const bom = BoxMaker(state);

    const newAssembly = Assembly({
      parent: scene,
      model: bom,
      material: woodMaterial,
    });

    if (assembly) {
      newAssembly.fadeIn(500, assembly.bbox);
      assembly.fadeOut();
    } else {
      newAssembly.fadeIn(0);
    }
    assembly = newAssembly;

    orbitController.target = assembly.bbox.getCenter();
    const pos = camera.position.clone().setLength(
      1.3*cameraDollyTo(camera.fov, cfg.dimL, cfg.dimH, cfg.dimW)
    );
    cameraPosTween.to(pos, TWEEN_DURATION).start();

    needsRender = true;
  }

  ob.startAnimation = function() {
    animate();
  }

  ob.stopAnimation = function() {
    if (frameReq) {
      window.cancelAnimationFrame(frameReq);
    }
  }

  if (cfg.el) {
    ob.attach(cfg.el);
  }

  window.addEventListener('resize', ob.resize);

  ob.setupScene();

  Store.subscribe(ob.updateGeometry);

  return ob;
}
