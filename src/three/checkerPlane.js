
export default function CheckerPlane(cfg) {
  // - colorA (str)
  // - colorB (str)
  // - width
  // - height
  // - tileSize

  const imageCanvas = document.createElement('canvas'),
        context = imageCanvas.getContext('2d');

  imageCanvas.width = imageCanvas.height = 128;
  context.fillStyle = cfg.colorA;
  context.fillRect(0, 0, 128, 128);
  context.fillStyle = cfg.colorB;
  context.fillRect(0, 0, 64, 64);
  context.fillRect(64, 64, 64, 64);

  const textureCanvas = new THREE.CanvasTexture(imageCanvas);
  textureCanvas.repeat.set(cfg.width/2 / cfg.tileSize, cfg.height/2 / cfg.tileSize);
  textureCanvas.wrapS = THREE.RepeatWrapping;
  textureCanvas.wrapT = THREE.RepeatWrapping;

  const materialCanvas = new THREE.MeshStandardMaterial({
    map: textureCanvas,
    metalness: 0.1,
    roughness: 0.85,
  });

  const geometry = new THREE.PlaneBufferGeometry(cfg.width, cfg.height);
  const meshCanvas = new THREE.Mesh( geometry, materialCanvas);

  return meshCanvas;

}
