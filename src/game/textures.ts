import * as THREE from 'three';

export interface ProceduralTextureSet {
  marbleTile: THREE.CanvasTexture;
  grassDeck: THREE.CanvasTexture;
  basaltStone: THREE.CanvasTexture;
  goldTrim: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  sparkSprite: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const aniso = Math.min(8, Math.max(1, maxAnisotropy));

  // 1. Marble & Temple Stone Tile
  const [mCanvas, mCtx] = makeCanvas(256);
  mCtx.fillStyle = '#e2e8f0';
  mCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const shade = 222 + ((x + y) % 2 === 0 ? 12 : -8);
      mCtx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 9})`;
      mCtx.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
    }
  }
  mCtx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
  mCtx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) {
    mCtx.beginPath();
    mCtx.moveTo(i, 0);
    mCtx.lineTo(i, 256);
    mCtx.stroke();
    mCtx.beginPath();
    mCtx.moveTo(0, i);
    mCtx.lineTo(256, i);
    mCtx.stroke();
  }
  // Subtle veins
  mCtx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  mCtx.lineWidth = 1.5;
  for (let v = 0; v < 14; v++) {
    mCtx.beginPath();
    const sx = (v * 53) % 256;
    const sy = (v * 97) % 256;
    mCtx.moveTo(sx, sy);
    mCtx.bezierCurveTo(sx + 25, sy - 15, sx + 45, sy + 20, sx + 70, sy + 8);
    mCtx.stroke();
  }
  const marbleTile = new THREE.CanvasTexture(mCanvas);
  marbleTile.colorSpace = THREE.SRGBColorSpace;
  marbleTile.wrapS = marbleTile.wrapT = THREE.RepeatWrapping;
  marbleTile.repeat.set(4, 1.5);
  marbleTile.anisotropy = aniso;

  // 2. Stylized Grass Deck
  const [gCanvas, gCtx] = makeCanvas(256);
  gCtx.fillStyle = '#22c55e';
  gCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 320; i++) {
    const gx = (i * 73) % 256;
    const gy = (i * 137) % 256;
    gCtx.fillStyle = i % 3 === 0 ? '#16a34a' : i % 3 === 1 ? '#4ade80' : '#15803d';
    gCtx.fillRect(gx, gy, 8, 4);
  }
  const grassDeck = new THREE.CanvasTexture(gCanvas);
  grassDeck.colorSpace = THREE.SRGBColorSpace;
  grassDeck.wrapS = grassDeck.wrapT = THREE.RepeatWrapping;
  grassDeck.repeat.set(5, 2);
  grassDeck.anisotropy = aniso;

  // 3. Basalt Volcanic Stone
  const [bCanvas, bCtx] = makeCanvas(256);
  bCtx.fillStyle = '#27272a';
  bCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const v = 38 + ((x * 3 + y) % 3) * 8;
      bCtx.fillStyle = `rgb(${v}, ${v}, ${v + 4})`;
      bCtx.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
    }
  }
  bCtx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  bCtx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    bCtx.beginPath();
    bCtx.moveTo((i * 45) % 256, 0);
    bCtx.lineTo(((i * 45 + 32) % 256), 256);
    bCtx.stroke();
  }
  const basaltStone = new THREE.CanvasTexture(bCanvas);
  basaltStone.colorSpace = THREE.SRGBColorSpace;
  basaltStone.wrapS = basaltStone.wrapT = THREE.RepeatWrapping;
  basaltStone.repeat.set(4, 1.5);
  basaltStone.anisotropy = aniso;

  // 4. Brushed Gold Trim
  const [auCanvas, auCtx] = makeCanvas(128);
  auCtx.fillStyle = '#f59e0b';
  auCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 2) {
    auCtx.fillStyle = y % 4 === 0 ? 'rgba(254, 243, 199, 0.16)' : 'rgba(180, 83, 9, 0.14)';
    auCtx.fillRect(0, y, 128, 1);
  }
  const goldTrim = new THREE.CanvasTexture(auCanvas);
  goldTrim.colorSpace = THREE.SRGBColorSpace;
  goldTrim.wrapS = goldTrim.wrapT = THREE.RepeatWrapping;
  goldTrim.anisotropy = aniso;

  // 5. Contact Shadow Radial Texture
  const [cCanvas, cCtx] = makeCanvas(128);
  const cGrad = cCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  cGrad.addColorStop(0, 'rgba(2, 6, 23, 0.65)');
  cGrad.addColorStop(0.55, 'rgba(2, 6, 23, 0.25)');
  cGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
  cCtx.fillStyle = cGrad;
  cCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(cCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;

  // 6. Particle Spark Sprite
  const [sCanvas, sCtx] = makeCanvas(64);
  const sGrad = sCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  sGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  sGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.75)');
  sGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 64, 64);
  const sparkSprite = new THREE.CanvasTexture(sCanvas);
  sparkSprite.colorSpace = THREE.SRGBColorSpace;

  return {
    marbleTile,
    grassDeck,
    basaltStone,
    goldTrim,
    contactShadow,
    sparkSprite,
    dispose: () => {
      marbleTile.dispose();
      grassDeck.dispose();
      basaltStone.dispose();
      goldTrim.dispose();
      contactShadow.dispose();
      sparkSprite.dispose();
    },
  };
}
