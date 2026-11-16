import * as THREE from 'three';
import type { ProceduralTextureSet } from './textures';
import type { FighterId, StageProfile } from './types';

export interface FighterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponPivot: THREE.Group;
  accentAccessory: THREE.Group; // cape / wings / halo / tail
  shieldMesh: THREE.Mesh;
  reflectAura: THREE.Mesh;
  stoneMesh: THREE.Mesh;
  slashArc: THREE.Mesh;
  playerRing: THREE.Mesh;
  markerDiamond: THREE.Mesh;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
  baseEmissives: THREE.Color[];
}

export interface StageVisuals {
  root: THREE.Group;
  platformGroups: Map<string, THREE.Group>;
  animatedProps: Array<(elapsed: number) => void>;
}

function makeBladeGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.07, 0);
  shape.lineTo(0.07, 0);
  shape.lineTo(0.09, 0.92);
  shape.lineTo(0, 1.18);
  shape.lineTo(-0.09, 0.92);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  geo.center();
  geo.translate(0, 0.56, 0);
  return geo;
}

function makeDaggerGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.045, 0);
  shape.lineTo(0.045, 0);
  shape.lineTo(0.06, 0.52);
  shape.lineTo(0, 0.72);
  shape.lineTo(-0.06, 0.52);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  geo.center();
  geo.translate(0, 0.34, 0);
  return geo;
}

function makeLightningTailGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(-0.22, 0.16);
  shape.lineTo(-0.1, 0.24);
  shape.lineTo(-0.36, 0.44);
  shape.lineTo(-0.2, 0.5);
  shape.lineTo(-0.5, 0.78);
  shape.lineTo(-0.24, 0.82);
  shape.lineTo(-0.04, 0.56);
  shape.lineTo(-0.18, 0.48);
  shape.lineTo(0.06, 0.28);
  shape.lineTo(-0.05, 0.2);
  shape.lineTo(0.08, 0.04);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
  });
  geo.center();
  return geo;
}

function makeKiteShieldGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.28);
  shape.lineTo(0.22, 0.22);
  shape.lineTo(0.2, -0.08);
  shape.lineTo(0, -0.32);
  shape.lineTo(-0.2, -0.08);
  shape.lineTo(-0.22, 0.22);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  geo.center();
  return geo;
}

export function buildFighterRig(
  fighterId: FighterId,
  accentColorHex: number,
  showOverheadMarker: boolean,
  textures: ProceduralTextureSet,
): FighterRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const hitFlashMaterials: THREE.MeshStandardMaterial[] = [];
  const baseEmissives: THREE.Color[] = [];

  const registerMat = (mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial => {
    hitFlashMaterials.push(mat);
    baseEmissives.push(mat.emissive.clone());
    return mat;
  };

  const isTitan = fighterId === 'titan';
  const isVespera = fighterId === 'vespera';
  const isLyra = fighterId === 'lyra';
  const isPuffo = fighterId === 'puffo';
  const isVoltik = fighterId === 'voltik';
  const isSelene = fighterId === 'selene';
  const isMarco = fighterId === 'marco';
  const isArion = fighterId === 'arion';
  const isVulpex = fighterId === 'vulpex';

  const scaleFactor = isTitan
    ? 1.18
    : isVoltik
      ? 0.86
      : isPuffo
        ? 0.9
        : isVespera
          ? 0.95
          : isVulpex
            ? 0.96
            : isMarco
              ? 0.98
              : isLyra
                ? 0.98
                : 1.02;
  bodyPivot.scale.setScalar(scaleFactor);

  // Materials tuned per fighter with clear roughness/metalness contrast
  const armorPalette: Record<
    FighterId,
    {
      armor: number;
      cloth: number;
      trim: number;
      glow: number;
      skin: number;
      metalness: number;
    }
  > = {
    kael: {
      armor: 0xc2410c,
      cloth: 0x7f1d1d,
      trim: 0xfbbf24,
      glow: 0xfb923c,
      skin: 0xf1c27d,
      metalness: 0.72,
    },
    vespera: {
      armor: 0x312e81,
      cloth: 0x1e1b4b,
      trim: 0x94a3b8,
      glow: 0x22d3ee,
      skin: 0xcbd5e1,
      metalness: 0.55,
    },
    titan: {
      armor: 0x475569,
      cloth: 0x1e293b,
      trim: 0xf59e0b,
      glow: 0xfbbf24,
      skin: 0x64748b,
      metalness: 0.18,
    },
    lyra: {
      armor: 0xecfdf5,
      cloth: 0x059669,
      trim: 0xfcd34d,
      glow: 0x34d399,
      skin: 0xfde2c4,
      metalness: 0.35,
    },
    voltik: {
      armor: 0xfacc15,
      cloth: 0x713f12,
      trim: 0x1e293b,
      glow: 0xef4444,
      skin: 0xfde047,
      metalness: 0.08,
    },
    puffo: {
      armor: 0xf472b6,
      cloth: 0xdc2626,
      trim: 0xfbbf24,
      glow: 0x38bdf8,
      skin: 0xf9a8d4,
      metalness: 0.06,
    },
    selene: {
      armor: 0xf8fafc,
      cloth: 0x6d28d9,
      trim: 0xfbbf24,
      glow: 0x22d3ee,
      skin: 0xfde2c4,
      metalness: 0.42,
    },
    marco: {
      armor: 0x2563eb,
      cloth: 0xdc2626,
      trim: 0xfbbf24,
      glow: 0xf97316,
      skin: 0xfde2c4,
      metalness: 0.14,
    },
    arion: {
      armor: 0x16a34a,
      cloth: 0x78350f,
      trim: 0xfbbf24,
      glow: 0x38bdf8,
      skin: 0xfde2c4,
      metalness: 0.45,
    },
    vulpex: {
      armor: 0xf1f5f9,
      cloth: 0x15803d,
      trim: 0x94a3b8,
      glow: 0x22d3ee,
      skin: 0xea580c,
      metalness: 0.48,
    },
  };

  const pal = armorPalette[fighterId];

  const armorMat = registerMat(
    new THREE.MeshStandardMaterial({
      color: pal.armor,
      roughness: isTitan ? 0.84 : 0.28,
      metalness: pal.metalness,
    }),
  );
  const clothMat = registerMat(
    new THREE.MeshStandardMaterial({
      color: pal.cloth,
      roughness: 0.82,
      metalness: 0.04,
    }),
  );
  const trimMat = registerMat(
    new THREE.MeshStandardMaterial({
      color: pal.trim,
      map: textures.goldTrim,
      roughness: 0.2,
      metalness: 0.9,
    }),
  );
  const glowMat = registerMat(
    new THREE.MeshStandardMaterial({
      color: pal.glow,
      emissive: pal.glow,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.1,
    }),
  );
  const skinMat = registerMat(
    new THREE.MeshStandardMaterial({
      color: pal.skin,
      roughness: 0.65,
      metalness: 0.05,
    }),
  );

  // Legs (pivot at hip y = 0.72 so feet touch y = 0)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(0, isPuffo ? 0.42 : 0.72, isPuffo ? -0.22 : -0.17);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0, isPuffo ? 0.42 : 0.72, isPuffo ? 0.22 : 0.17);
  bodyPivot.add(leftLeg, rightLeg);

  const legWidth = isTitan ? 0.26 : isPuffo ? 0.2 : 0.19;
  const thighGeo = new THREE.CapsuleGeometry(legWidth * 0.45, 0.32, 4, 10);
  const bootGeo = new THREE.BoxGeometry(legWidth * 1.35, 0.22, legWidth * 1.05);

  if (isPuffo) {
    // Puffo plump red oval shoes directly below spherical body
    [leftLeg, rightLeg].forEach((leg) => {
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), clothMat);
      shoe.scale.set(1.5, 0.72, 1.0);
      shoe.position.set(0.08, -0.26, 0);
      shoe.castShadow = true;
      leg.add(shoe);
    });
  } else {
    [leftLeg, rightLeg].forEach((leg) => {
      const thigh = new THREE.Mesh(thighGeo, isMarco ? armorMat : clothMat);
      thigh.position.y = -0.26;
      thigh.castShadow = true;
      leg.add(thigh);

      const greave = new THREE.Mesh(
        new THREE.CylinderGeometry(legWidth * 0.46, legWidth * 0.52, 0.28, 10),
        isMarco ? armorMat : isVulpex ? trimMat : armorMat,
      );
      greave.position.y = -0.48;
      greave.castShadow = true;
      leg.add(greave);

      const bootMat = isMarco || isArion ? clothMat : trimMat;
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(0.05, -0.61, 0);
      boot.castShadow = true;
      leg.add(boot);
    });
  }

  // Torso group
  const torso = new THREE.Group();
  torso.position.set(0, isPuffo ? 0.68 : 0.75, 0);
  bodyPivot.add(torso);

  if (isPuffo) {
    // Spherical Kirby-inspired body
    const bodySphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), armorMat);
    bodySphere.position.y = 0.12;
    bodySphere.castShadow = true;
    torso.add(bodySphere);
  } else {
    // Pelvis / Belt
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(isTitan ? 0.42 : 0.3, isTitan ? 0.38 : 0.28, 0.18, 12),
      isArion ? clothMat : trimMat,
    );
    belt.position.y = 0.08;
    belt.castShadow = true;
    torso.add(belt);

    // Chestplate / Tunic / Overalls
    const chestTop = isTitan ? 0.56 : isVespera ? 0.34 : isVoltik ? 0.32 : 0.4;
    const chestBot = isTitan ? 0.38 : isVoltik ? 0.34 : 0.27;
    const chest = new THREE.Mesh(
      new THREE.CylinderGeometry(chestTop, chestBot, isTitan ? 0.62 : 0.54, 12),
      isVulpex ? clothMat : armorMat,
    );
    chest.position.y = 0.42;
    chest.castShadow = true;
    torso.add(chest);

    if (isVoltik) {
      // Dorsal dark brown stripes
      [-0.14, 0.14].forEach((yOff) => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.42), clothMat);
        stripe.position.set(-0.27, 0.42 + yOff, 0);
        torso.add(stripe);
      });
    } else if (isMarco) {
      // Red undershirt sleeves + 2 golden overall buttons
      const shirtChest = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.18, 12), clothMat);
      shirtChest.position.y = 0.6;
      torso.add(shirtChest);

      [-0.12, 0.12].forEach((zOff) => {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 10), trimMat);
        btn.rotation.z = Math.PI / 2;
        btn.position.set(0.36, 0.46, zOff);
        torso.add(btn);
      });
    } else if (isArion) {
      // Emerald tunic skirt + leather chest baldric
      const tunicSkirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.29, 0.42, 0.38, 14),
        armorMat,
      );
      tunicSkirt.position.y = -0.05;
      tunicSkirt.castShadow = true;
      torso.add(tunicSkirt);

      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.58), clothMat);
      strap.position.y = 0.44;
      strap.rotation.z = 0.55;
      torso.add(strap);
    } else if (isVulpex) {
      // White pilot sleeves/collar + red scarf
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 8, 16), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.75 }));
      scarf.rotation.x = Math.PI / 2;
      scarf.position.y = 0.68;
      torso.add(scarf);
    } else {
      // Emissive chest core for Kael / Vespera / Titan / Lyra / Selene
      const core = new THREE.Mesh(
        isTitan
          ? new THREE.OctahedronGeometry(0.16, 0)
          : new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12),
        glowMat,
      );
      core.rotation.z = Math.PI / 2;
      core.position.set(chestTop * 0.72, 0.46, 0);
      torso.add(core);
    }

    // Skirt for Lyra and Selene
    if (isLyra || isSelene) {
      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, isSelene ? 0.56 : 0.48, isSelene ? 0.62 : 0.46, 14, 1, false),
        clothMat,
      );
      skirt.position.y = isSelene ? -0.14 : -0.1;
      skirt.castShadow = true;
      torso.add(skirt);
    }
  }

  // Head group
  const head = new THREE.Group();
  head.position.set(0, isTitan ? 0.8 : isPuffo ? 0.05 : 0.74, 0);
  torso.add(head);

  if (!isPuffo) {
    const useSkinHead = isLyra || fighterId === 'kael' || isSelene || isMarco || isArion;
    const headMat = useSkinHead ? skinMat : isVulpex ? skinMat : armorMat;
    const cranium = new THREE.Mesh(
      new THREE.SphereGeometry(isTitan ? 0.27 : isVoltik ? 0.27 : 0.24, 16, 14),
      headMat,
    );
    cranium.position.y = 0.2;
    cranium.castShadow = true;
    head.add(cranium);
  }

  if (fighterId === 'kael') {
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(0.255, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      armorMat,
    );
    helm.position.y = 0.22;
    helm.castShadow = true;
    head.add(helm);

    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.07), trimMat);
    crest.position.set(-0.04, 0.46, 0);
    crest.rotation.z = 0.2;
    head.add(crest);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.26), glowMat);
    visor.position.set(0.18, 0.22, 0);
    head.add(visor);
  } else if (fighterId === 'vespera') {
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.08, 16, 1, true, -0.9, 1.8), glowMat);
    visor.position.y = 0.22;
    visor.rotation.y = Math.PI / 2;
    head.add(visor);

    [-1, 1].forEach((side) => {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.28, 6), trimMat);
      fin.position.set(-0.08, 0.39, side * 0.16);
      fin.rotation.z = 0.45;
      fin.rotation.x = side * 0.25;
      head.add(fin);
    });
  } else if (fighterId === 'titan') {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.46), trimMat);
    brow.position.set(0.08, 0.34, 0);
    head.add(brow);

    [-0.1, 0.1].forEach((zOff) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.055, 0.08), glowMat);
      eye.position.set(0.23, 0.22, zOff);
      head.add(eye);
    });
  } else if (isLyra) {
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.032, 8, 18), trimMat);
    crown.rotation.x = Math.PI / 2;
    crown.rotation.z = -0.18;
    crown.position.y = 0.36;
    head.add(crown);

    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), glowMat);
    gem.position.set(0.2, 0.38, 0);
    head.add(gem);
  } else if (isVoltik) {
    // Pointed black-tipped ears + glowing red cheeks + dark eyes
    [-1, 1].forEach((side) => {
      const earBase = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.34, 8), armorMat);
      earBase.position.set(-0.04, 0.48, side * 0.18);
      earBase.rotation.z = 0.28;
      earBase.rotation.x = side * 0.35;
      head.add(earBase);

      const earTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 8), trimMat);
      earTip.position.set(-0.09, 0.62, side * 0.25);
      earTip.rotation.z = 0.28;
      earTip.rotation.x = side * 0.35;
      head.add(earTip);

      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), glowMat);
      cheek.position.set(0.2, 0.13, side * 0.16);
      head.add(cheek);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), trimMat);
      eye.position.set(0.24, 0.24, side * 0.1);
      head.add(eye);
    });
  } else if (isPuffo) {
    // Expressive eyes & rosy cheeks right on front of spherical body
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25 });
    const cheekMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.6 });
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.08, 4, 8), eyeMat);
      eye.position.set(0.45, 0.2, side * 0.13);
      head.add(eye);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), glowMat);
      iris.position.set(0.48, 0.24, side * 0.13);
      head.add(iris);

      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), cheekMat);
      cheek.scale.set(0.5, 0.7, 1.2);
      cheek.position.set(0.43, 0.07, side * 0.24);
      head.add(cheek);
    });
  } else if (isSelene) {
    // Golden royal hair + tiara with cyan gem + elf ears
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45, metalness: 0.2 });
    const hairBack = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.58, 12), hairMat);
    hairBack.position.set(-0.08, 0.08, 0);
    hairBack.rotation.z = -0.15;
    head.add(hairBack);

    const tiara = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.032, 8, 18), trimMat);
    tiara.rotation.x = Math.PI / 2;
    tiara.position.y = 0.34;
    head.add(tiara);

    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), glowMat);
    gem.position.set(0.22, 0.36, 0);
    head.add(gem);

    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 6), skinMat);
      ear.rotation.x = side * 1.15;
      ear.rotation.z = 0.3;
      ear.position.set(0, 0.2, side * 0.28);
      head.add(ear);
    });
  } else if (isMarco) {
    // Iconic red cap + visor brim + white front emblem + mustache + nose
    const capDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.255, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
      clothMat,
    );
    capDome.position.y = 0.23;
    head.add(capDome);

    const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.05, 14, 1, false, -0.9, 1.8), clothMat);
    capBrim.position.set(0.12, 0.27, 0);
    capBrim.rotation.z = -0.12;
    head.add(capBrim);

    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
    badge.rotation.z = Math.PI / 2;
    badge.position.set(0.23, 0.36, 0);
    head.add(badge);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), skinMat);
    nose.position.set(0.26, 0.17, 0);
    head.add(nose);

    const stache = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.055, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x29150b, roughness: 0.8 }),
    );
    stache.position.set(0.24, 0.11, 0);
    head.add(stache);
  } else if (isArion) {
    // Blonde hair fringe + trailing emerald pointed cap + elf ears
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
    const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.36), hairMat);
    bangs.position.set(0.18, 0.28, 0);
    head.add(bangs);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.65, 12), armorMat);
    cap.position.set(-0.16, 0.38, 0);
    cap.rotation.z = 0.92;
    cap.castShadow = true;
    head.add(cap);

    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 6), skinMat);
      ear.rotation.x = side * 1.15;
      ear.position.set(0, 0.19, side * 0.27);
      head.add(ear);
    });
  } else if (isVulpex) {
    // Fox snout + pointed fox ears + cyan pilot scouter
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
    const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.24, 10), creamMat);
    muzzle.rotation.z = -Math.PI / 2;
    muzzle.position.set(0.26, 0.15, 0);
    head.add(muzzle);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));
    nose.position.set(0.38, 0.16, 0);
    head.add(nose);

    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 8), skinMat);
      ear.position.set(-0.02, 0.46, side * 0.16);
      ear.rotation.x = side * 0.32;
      ear.rotation.z = 0.15;
      head.add(ear);
    });

    const scouter = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.14), glowMat);
    scouter.position.set(0.22, 0.25, 0.11);
    head.add(scouter);
  }

  // Arms & Pauldrons
  const leftArm = new THREE.Group();
  leftArm.position.set(0, isPuffo ? 0.16 : 0.62, isTitan ? -0.58 : isPuffo ? -0.46 : -0.4);
  const rightArm = new THREE.Group();
  rightArm.position.set(0, isPuffo ? 0.16 : 0.62, isTitan ? 0.58 : isPuffo ? 0.46 : 0.4);
  torso.add(leftArm, rightArm);

  if (isPuffo) {
    [leftArm, rightArm].forEach((arm) => {
      const stub = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.16, 4, 8), armorMat);
      stub.position.y = -0.06;
      stub.castShadow = true;
      arm.add(stub);
    });
  } else {
    const gloveWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    [leftArm, rightArm].forEach((arm, idx) => {
      const pauldron = new THREE.Mesh(
        new THREE.SphereGeometry(isTitan ? 0.24 : 0.15, 12, 10),
        isMarco || isVoltik ? armorMat : trimMat,
      );
      pauldron.scale.set(1.1, 0.85, 1.1);
      pauldron.castShadow = true;
      arm.add(pauldron);

      const upperArm = new THREE.Mesh(
        new THREE.CapsuleGeometry(isTitan ? 0.13 : 0.085, 0.32, 4, 8),
        isMarco ? clothMat : isVulpex ? armorMat : armorMat,
      );
      upperArm.position.y = -0.24;
      upperArm.castShadow = true;
      arm.add(upperArm);

      const gauntlet = new THREE.Mesh(
        new THREE.CylinderGeometry(isTitan ? 0.14 : 0.095, isTitan ? 0.12 : 0.08, 0.24, 10),
        isMarco ? gloveWhiteMat : idx === 1 ? trimMat : clothMat,
      );
      gauntlet.position.y = -0.48;
      gauntlet.castShadow = true;
      arm.add(gauntlet);
    });
  }

  // Weapon Pivot attached to rightArm
  const weaponPivot = new THREE.Group();
  weaponPivot.position.set(0.08, isPuffo ? -0.18 : -0.56, 0);
  rightArm.add(weaponPivot);

  if (fighterId === 'kael') {
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 8), trimMat);
    hilt.rotation.z = Math.PI / 2;
    weaponPivot.add(hilt);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.08), trimMat);
    guard.position.x = 0.12;
    weaponPivot.add(guard);
    const blade = new THREE.Mesh(makeBladeGeometry(), glowMat);
    blade.rotation.z = -Math.PI / 2;
    blade.position.x = 0.14;
    blade.castShadow = true;
    weaponPivot.add(blade);
  } else if (fighterId === 'vespera') {
    const daggerR = new THREE.Mesh(makeDaggerGeometry(), glowMat);
    daggerR.rotation.z = -Math.PI / 2;
    daggerR.position.x = 0.06;
    weaponPivot.add(daggerR);

    const daggerL = new THREE.Mesh(makeDaggerGeometry(), glowMat);
    daggerL.rotation.z = -Math.PI / 2;
    daggerL.position.set(0.08, -0.54, 0);
    leftArm.add(daggerL);
  } else if (fighterId === 'titan') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.25, 10), clothMat);
    shaft.rotation.z = -Math.PI / 2;
    shaft.position.x = 0.55;
    shaft.castShadow = true;
    weaponPivot.add(shaft);

    const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.42), armorMat);
    hammerHead.position.x = 1.15;
    hammerHead.castShadow = true;
    weaponPivot.add(hammerHead);

    const hammerCap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.46), trimMat);
    hammerCap.position.x = 1.15;
    weaponPivot.add(hammerCap);
  } else if (isLyra) {
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 1.45, 10), trimMat);
    staff.rotation.z = -Math.PI / 2.2;
    staff.position.set(0.42, 0.15, 0);
    staff.castShadow = true;
    weaponPivot.add(staff);

    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 1), glowMat);
    orb.position.set(1.06, 0.34, 0);
    weaponPivot.add(orb);
  } else if (isArion) {
    // Winged crossguard + Hero's glowing blade + Kite Shield on leftArm
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.24, 8), trimMat);
    hilt.rotation.z = Math.PI / 2;
    weaponPivot.add(hilt);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.08), trimMat);
    guard.position.x = 0.11;
    weaponPivot.add(guard);
    const blade = new THREE.Mesh(makeBladeGeometry(), glowMat);
    blade.rotation.z = -Math.PI / 2;
    blade.position.x = 0.13;
    blade.castShadow = true;
    weaponPivot.add(blade);

    const shieldBoard = new THREE.Mesh(
      makeKiteShieldGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.45 }),
    );
    shieldBoard.position.set(0.08, -0.45, -0.14);
    shieldBoard.rotation.y = Math.PI / 2;
    shieldBoard.castShadow = true;
    leftArm.add(shieldBoard);
  } else if (isVulpex) {
    // Sci-fi blaster pistol
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.09), trimMat);
    barrel.position.set(0.18, 0.04, 0);
    weaponPivot.add(barrel);
    const muzzleGlow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), glowMat);
    muzzleGlow.position.set(0.4, 0.04, 0);
    weaponPivot.add(muzzleGlow);
  } else if (isSelene) {
    const arcaneOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), glowMat);
    arcaneOrb.position.set(0.14, 0, 0);
    weaponPivot.add(arcaneOrb);
  } else if (isMarco) {
    const fireSpark = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), glowMat);
    fireSpark.position.set(0.12, 0, 0);
    weaponPivot.add(fireSpark);
  }

  // Accent accessory (cape / wings / halo / lightning tail / fox tail / crest)
  const accentAccessory = new THREE.Group();
  accentAccessory.position.set(-0.28, isPuffo ? 0.12 : 0.56, 0);
  torso.add(accentAccessory);

  if (fighterId === 'kael' || isMarco) {
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.76, 0.52), clothMat);
    cape.position.set(-0.08, -0.34, 0);
    cape.rotation.z = -0.18;
    cape.castShadow = true;
    accentAccessory.add(cape);
  } else if (fighterId === 'vespera') {
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.16), glowMat);
      wing.position.set(-0.18, 0.05, side * 0.28);
      wing.rotation.y = side * 0.45;
      wing.rotation.z = -0.35;
      accentAccessory.add(wing);
    });
  } else if (fighterId === 'titan') {
    const reactor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.35, 8), trimMat);
    reactor.rotation.z = Math.PI / 2;
    reactor.position.set(-0.14, -0.1, 0);
    accentAccessory.add(reactor);
  } else if (isLyra) {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.032, 8, 24), glowMat);
    halo.rotation.y = Math.PI / 2;
    halo.position.set(-0.16, 0.04, 0);
    accentAccessory.add(halo);
  } else if (isVoltik) {
    const tail = new THREE.Mesh(makeLightningTailGeometry(), armorMat);
    tail.position.set(-0.26, -0.1, 0);
    tail.castShadow = true;
    accentAccessory.add(tail);
  } else if (isSelene) {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), trimMat);
    crystal.position.set(-0.24, 0.08, 0);
    accentAccessory.add(crystal);
  } else if (isVulpex) {
    const tailBase = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.65, 10), skinMat);
    tailBase.position.set(-0.22, -0.32, 0);
    tailBase.rotation.z = -1.05;
    accentAccessory.add(tailBase);
  } else if (isPuffo) {
    const starCharm = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), trimMat);
    starCharm.position.set(-0.25, 0.12, 0);
    accentAccessory.add(starCharm);
  } else if (isArion) {
    // Scabbard on back
    const scabbard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), clothMat);
    scabbard.position.set(-0.08, -0.15, 0);
    scabbard.rotation.z = -0.55;
    accentAccessory.add(scabbard);
  }

  // Translucent energy shield sphere
  const shieldMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 20, 16),
    new THREE.MeshBasicMaterial({
      color: accentColorHex,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );
  shieldMesh.position.y = 1.05;
  shieldMesh.visible = false;
  root.add(shieldMesh);

  // Reflector diamond / crystal aura (Selene Nayru, Marco Cape, Vulpex Shine)
  const reflectAura = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.05, 0),
    new THREE.MeshBasicMaterial({
      color: pal.glow,
      transparent: true,
      opacity: 0.48,
      wireframe: false,
      depthWrite: false,
    }),
  );
  reflectAura.position.y = 1.02;
  reflectAura.visible = false;
  root.add(reflectAura);

  // Puffo Stone transformation block (Roca Cósmica S+K)
  const stoneMesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.68, 0),
    new THREE.MeshStandardMaterial({
      color: 0x475569,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6,
      roughness: 0.75,
      metalness: 0.35,
      flatShading: true,
    }),
  );
  stoneMesh.position.y = 0.75;
  stoneMesh.castShadow = true;
  stoneMesh.visible = false;
  root.add(stoneMesh);

  // Dynamic attack slash arc
  const slashArc = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.09, 6, 18, Math.PI * 0.85),
    new THREE.MeshBasicMaterial({
      color: pal.glow,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  slashArc.position.set(0.55, 1.05, 0);
  slashArc.visible = false;
  root.add(slashArc);

  // Subtle grounded player/team ring at feet
  const playerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.58, 24),
    new THREE.MeshBasicMaterial({
      color: accentColorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    }),
  );
  playerRing.rotation.x = -Math.PI / 2;
  playerRing.position.y = 0.03;
  root.add(playerRing);

  // Overhead team/player diamond marker for multi-fighter readability
  const markerDiamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({
      color: accentColorHex,
    }),
  );
  markerDiamond.position.set(0, 2.55, 0);
  markerDiamond.visible = showOverheadMarker;
  root.add(markerDiamond);

  return {
    root,
    bodyPivot,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponPivot,
    accentAccessory,
    shieldMesh,
    reflectAura,
    stoneMesh,
    slashArc,
    playerRing,
    markerDiamond,
    hitFlashMaterials,
    baseEmissives,
  };
}

export function buildStageVisuals(
  stage: StageProfile,
  textures: ProceduralTextureSet,
): StageVisuals {
  const root = new THREE.Group();
  const platformGroups = new Map<string, THREE.Group>();
  const animatedProps: Array<(elapsed: number) => void> = [];

  const isSkyTemple = stage.id === 'sky_temple';
  const isPillar = stage.id === 'pillar_sanctuary';
  const isSummit = stage.id === 'golden_summit';

  // Build platforms
  stage.platforms.forEach((plat) => {
    const group = new THREE.Group();
    group.position.set(plat.x, plat.y, 0);

    if (!plat.oneWay) {
      // Main floating island with tapered stone underside
      const topMat = new THREE.MeshStandardMaterial({
        map: isSkyTemple
          ? textures.grassDeck
          : isPillar
            ? textures.marbleTile
            : textures.basaltStone,
        roughness: isSkyTemple ? 0.78 : 0.48,
        metalness: isSummit ? 0.25 : 0.08,
      });
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(plat.width, plat.thickness, plat.depth),
        topMat,
      );
      deck.position.y = -plat.thickness / 2;
      deck.receiveShadow = true;
      deck.castShadow = true;
      group.add(deck);

      // Ornate border trim (slightly proud on Z/X to avoid coplanar z-fighting)
      const trimMat = new THREE.MeshStandardMaterial({
        color: isSummit ? 0xf59e0b : isPillar ? 0x14b8a6 : 0xe2e8f0,
        map: isSummit ? textures.goldTrim : textures.marbleTile,
        roughness: isSummit ? 0.24 : 0.42,
        metalness: isSummit ? 0.85 : 0.18,
      });
      const rim = new THREE.Mesh(
        new THREE.BoxGeometry(plat.width + 0.24, 0.34, plat.depth + 0.24),
        trimMat,
      );
      rim.position.y = -0.17;
      rim.receiveShadow = true;
      group.add(rim);

      // Sculpted floating island underside rock spire
      const rockMat = new THREE.MeshStandardMaterial({
        color: isSummit ? 0x27272a : isPillar ? 0x334155 : 0x64748b,
        roughness: 0.88,
        metalness: 0.06,
        flatShading: true,
      });
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(plat.width * 0.44, 5.2, 7),
        rockMat,
      );
      spire.rotation.x = Math.PI;
      spire.scale.set(1.15, 1, 0.42);
      spire.position.y = -plat.thickness - 2.4;
      group.add(spire);

      // Secondary hanging rock clusters
      [-plat.width * 0.3, plat.width * 0.3].forEach((rx, idx) => {
        const sub = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.1, 6), rockMat);
        sub.rotation.x = Math.PI;
        sub.position.set(rx, -plat.thickness - 1.35, idx === 0 ? 0.4 : -0.4);
        group.add(sub);
      });

      // Stage-specific landmark props in the background edge (z < -1.8)
      if (isSkyTemple) {
        [-plat.width * 0.38, plat.width * 0.38].forEach((px) => {
          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.38, 2.8, 10),
            trimMat,
          );
          pillar.position.set(px, 1.4, -plat.depth * 0.44);
          pillar.castShadow = true;
          group.add(pillar);

          const lantern = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.28, 0),
            new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              emissive: 0x38bdf8,
              emissiveIntensity: 1.6,
              roughness: 0.2,
            }),
          );
          lantern.position.set(px, 3.15, -plat.depth * 0.44);
          group.add(lantern);
          animatedProps.push((t) => {
            lantern.rotation.y = t * 1.4;
            lantern.position.y = 3.15 + Math.sin(t * 2.2 + px) * 0.14;
          });
        });
      } else if (isPillar) {
        [-5.2, 5.2].forEach((ox) => {
          const obelisk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.24, 0.45, 3.8, 4),
            trimMat,
          );
          obelisk.position.set(ox, 1.9, -plat.depth * 0.45);
          obelisk.rotation.y = Math.PI / 4;
          obelisk.castShadow = true;
          group.add(obelisk);
        });
      } else if (isSummit) {
        [-6.5, 6.5].forEach((bx) => {
          const brazier = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.36, 1.2, 8),
            trimMat,
          );
          brazier.position.set(bx, 0.6, -plat.depth * 0.44);
          brazier.castShadow = true;
          group.add(brazier);

          const flame = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.36, 0),
            new THREE.MeshStandardMaterial({
              color: 0xf97316,
              emissive: 0xf97316,
              emissiveIntensity: 2.0,
              roughness: 0.2,
            }),
          );
          flame.position.set(bx, 1.5, -plat.depth * 0.44);
          group.add(flame);
          animatedProps.push((t) => {
            flame.rotation.y = t * 2.1;
            flame.scale.setScalar(0.92 + Math.sin(t * 7 + bx) * 0.14);
          });
        });
      }
    } else {
      // One-way pass-through floating platform
      const slabMat = new THREE.MeshStandardMaterial({
        map: isSummit ? textures.goldTrim : textures.marbleTile,
        color: isSummit ? 0xfbbf24 : isPillar ? 0x99f6e4 : 0xf1f5f9,
        roughness: isSummit ? 0.26 : 0.36,
        metalness: isSummit ? 0.8 : 0.25,
      });
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(plat.width, plat.thickness, plat.depth),
        slabMat,
      );
      slab.position.y = -plat.thickness / 2;
      slab.castShadow = true;
      slab.receiveShadow = true;
      group.add(slab);

      // Glowing underside rim so pass-through ledges read cleanly
      const glowStrip = new THREE.Mesh(
        new THREE.BoxGeometry(plat.width - 0.15, 0.08, plat.depth + 0.08),
        new THREE.MeshStandardMaterial({
          color: stage.accentColor,
          emissive: stage.accentColor,
          emissiveIntensity: 1.2,
          roughness: 0.2,
        }),
      );
      glowStrip.position.y = -plat.thickness - 0.02;
      group.add(glowStrip);
    }

    root.add(group);
    platformGroups.set(plat.id, group);
  });

  // Distant floating sky islands & temple silhouettes for rich horizon depth
  const distantIslands = [
    { x: -19, y: 2.5, z: -18, s: 1.6 },
    { x: 18, y: 4.5, z: -22, s: 2.0 },
    { x: -7, y: -3.5, z: -26, s: 2.3 },
    { x: 9, y: 8.5, z: -30, s: 1.8 },
  ];
  const bgRockMat = new THREE.MeshStandardMaterial({
    color: isSummit ? 0x3f2e3e : isPillar ? 0x1e3a4c : 0x64748b,
    roughness: 0.86,
    flatShading: true,
  });
  const bgCapMat = new THREE.MeshStandardMaterial({
    color: isSummit ? 0xd97706 : isPillar ? 0x2dd4bf : 0x4ade80,
    roughness: 0.72,
  });

  distantIslands.forEach((isl, idx) => {
    const g = new THREE.Group();
    g.position.set(isl.x, isl.y, isl.z);
    g.scale.setScalar(isl.s);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.4, 0.7, 8), bgCapMat);
    g.add(cap);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.3, 4.2, 7), bgRockMat);
    cone.rotation.x = Math.PI;
    cone.position.y = -2.4;
    g.add(cone);

    root.add(g);
    animatedProps.push((t) => {
      g.position.y = isl.y + Math.sin(t * 0.55 + idx * 1.3) * 0.45;
    });
  });

  // Instanced clouds / atmospheric embers (28 instances)
  const cloudCount = 28;
  const cloudGeo = isSummit
    ? new THREE.OctahedronGeometry(0.18, 0)
    : new THREE.IcosahedronGeometry(0.95, 1);
  const cloudMat = isSummit
    ? new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xfb923c,
        emissiveIntensity: 1.8,
        roughness: 0.3,
      })
    : new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.0,
        transparent: true,
        opacity: 0.78,
      });

  const clouds = new THREE.InstancedMesh(cloudGeo, cloudMat, cloudCount);
  const dummy = new THREE.Object3D();
  const seeds = Array.from({ length: cloudCount }, (_, i) => ({
    x: ((i * 37) % 52) - 26,
    y: isSummit ? ((i * 19) % 18) - 8 : -7 - ((i * 13) % 9),
    z: -8 - ((i * 23) % 24),
    scale: isSummit ? 0.6 + (i % 4) * 0.35 : 0.8 + (i % 5) * 0.45,
    speed: 0.35 + (i % 5) * 0.14,
  }));

  seeds.forEach((s, i) => {
    dummy.position.set(s.x, s.y, s.z);
    dummy.scale.set(s.scale * (isSummit ? 1 : 1.7), s.scale * (isSummit ? 1 : 0.65), s.scale);
    dummy.updateMatrix();
    clouds.setMatrixAt(i, dummy.matrix);
  });
  clouds.instanceMatrix.needsUpdate = true;
  clouds.computeBoundingSphere();
  clouds.frustumCulled = false;
  root.add(clouds);

  animatedProps.push((t) => {
    for (let i = 0; i < cloudCount; i++) {
      const s = seeds[i];
      if (isSummit) {
        const yPos = ((s.y + t * s.speed * 1.8 + 10) % 22) - 10;
        dummy.position.set(s.x + Math.sin(t + i) * 0.5, yPos, s.z);
        dummy.rotation.set(t + i, t * 0.8, 0);
        dummy.scale.setScalar(s.scale);
      } else {
        const xPos = ((s.x + t * s.speed + 28) % 56) - 28;
        dummy.position.set(xPos, s.y + Math.sin(t * 0.6 + i) * 0.25, s.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(s.scale * 1.7, s.scale * 0.65, s.scale);
      }
      dummy.updateMatrix();
      clouds.setMatrixAt(i, dummy.matrix);
    }
    clouds.instanceMatrix.needsUpdate = true;
  });

  return { root, platformGroups, animatedProps };
}

export function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    }
  });
}
