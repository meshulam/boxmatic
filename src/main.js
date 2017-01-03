import BoxMaker from './boxmaker';
import * as ThreeOrbit from 'three/examples/js/controls/OrbitControls';
import {toSvgPath, boundingBox} from './path';

const DEFAULT_SVG_STYLE = 'stroke="black" fill="none" stroke-width="0.02" ';


function toSvg(paths) {
  const elems = [];
  let maxX = 0,
      maxY = 0;

  paths.forEach(path => {
    let [minPt, maxPt] = boundingBox(path);
    maxX = Math.max(maxX, maxPt.x);
    maxY = Math.max(maxY, maxPt.y);

    elems.push(`<path d="${toSvgPath(path)}" />`);
  });

  return [
    `<svg viewBox="0 0 ${maxX} ${maxY}" ${DEFAULT_SVG_STYLE} >`,
      ...elems,
    `</svg>`
  ].join('');
}

let cfg = {
  dimL: 10,
  dimW: 12,
  dimH: 8,
  thickness: 0.5,
}

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

const bom = BoxMaker(cfg);


const faces = bom.makeFaces();
const sv = toSvg(faces);
//document.body.innerHTML += sv;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, 1, 1, 10000 );
camera.position.z = 20;
const renderer = new THREE.WebGLRenderer({ antialias: true });
const wdwSize = Math.min(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(wdwSize, wdwSize);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

const orbit = new THREE.OrbitControls(camera, renderer.domElement);
orbit.enableZoom = false;

var lights = [];
lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

lights[ 0 ].position.set( 0, 200, 0 );
lights[ 1 ].position.set( 100, 200, 100 );
lights[ 2 ].position.set( - 100, - 200, - 100 );

scene.add( lights[ 0 ] );
scene.add( lights[ 1 ] );
scene.add( lights[ 2 ] );

let material = new THREE.MeshPhongMaterial({
  color: 0x156289,
  emissive: 0x072534,
  side: THREE.DoubleSide,
  shading: THREE.FlatShading
});

let meshes = [0, 1, 2, 3, 4].map((i) => {
  const path = bom.makeFacePath(i);
  const geom = toThreeGeom(path, bom.thickness);
  const m = new THREE.Matrix4();
  m.set(...bom.transform3D(i));
  geom.applyMatrix(m);
  return new THREE.Mesh(geom);
});

meshes.forEach(mesh => scene.add(mesh));

let render = function () {
   requestAnimationFrame( render );
   renderer.render(scene, camera);
}

render();
