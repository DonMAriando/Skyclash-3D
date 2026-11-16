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
  accentAccessory: THREE.Group; // cape / wings / halo
  shieldMesh: THREE.Mesh;
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

  const scaleFactor = isTitan ? 1.18 : isVespera ? 0.95 : isLyra ? 0.98 : 1.02;
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
  leftLeg.position.set(0, 0.72, -0.17);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0, 0.72, 0.17);
  bodyPivot.add(leftLeg, rightLeg);

  const legWidth = isTitan ? 0.26 : 0.19;
  const thighGeo = new THREE.CapsuleGeometry(legWidth * 0.45, 0.32, 4, 10);
  const bootGeo = new THREE.BoxGeometry(legWidth * 1.35, 0.22, legWidth * 1.05);

  [leftLeg, rightLeg].forEach((leg) => {
    const thigh = new THREE.Mesh(thighGeo, clothMat);
    thigh.position.y = -0.26;
    thigh.castShadow = true;
    leg.add(thigh);

    const greave = new THREE.Mesh(
      new THREE.CylinderGeometry(legWidth * 0.46, legWidth * 0.52, 0.28, 10),
      armorMat,
    );
    greave.position.y = -0.48;
    greave.castShadow = true;
    leg.add(greave);

    const boot = new THREE.Mesh(bootGeo, trimMat);
    boot.position.set(0.05, -0.61, 0);
    boot.castShadow = true;
    leg.add(boot);
  });

  // Torso group
  const torso = new THREE.Group();
  torso.position.set(0, 0.75, 0);
  bodyPivot.add(torso);

  // Pelvis / Belt
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(isTitan ? 0.42 : 0.3, isTitan ? 0.38 : 0.28, 0.18, 12),
    trimMat,
  );
  belt.position.y = 0.08;
  belt.castShadow = true;
  torso.add(belt);

  // Chestplate
  const chestTop = isTitan ? 0.56 : isVespera ? 0.34 : 0.4;
  const chestBot = isTitan ? 0.38 : 0.27;
  const chest = new THREE.Mesh(
    new THREE.CylinderGeometry(chestTop, chestBot, isTitan ? 0.62 : 0.54, 12),
    armorMat,
  );
  chest.position.y = 0.42;
  chest.castShadow = true;
  torso.add(chest);

  // Emissive chest core
  const core = new THREE.Mesh(
    isTitan
      ? new THREE.OctahedronGeometry(0.16, 0)
      : new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12),
    glowMat,
  );
  core.rotation.z = Math.PI / 2;
  core.position.set(chestTop * 0.72, 0.46, 0);
  torso.add(core);

  // Lyra tunic skirt
  if (isLyra) {
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.48, 0.46, 14, 1, false),
      clothMat,
    );
    skirt.position.y = -0.1;
    skirt.castShadow = true;
    torso.add(skirt);
  }

  // Head group
  const head = new THREE.Group();
  head.position.set(0, isTitan ? 0.8 : 0.74, 0);
  torso.add(head);

  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(isTitan ? 0.27 : 0.24, 16, 14),
    fighterId === 'lyra' || fighterId === 'kael' ? skinMat : armorMat,
  );
  cranium.position.y = 0.2;
  cranium.castShadow = true;
  head.add(cranium);

  if (fighterId === 'kael') {
    // Crested solar helm
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
    // Sleek sentinel visor + twin cyber horns
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
    // Monolith brow + glowing eyes
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.46), trimMat);
    brow.position.set(0.08, 0.34, 0);
    head.add(brow);

    [-0.1, 0.1].forEach((zOff) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.055, 0.08), glowMat);
      eye.position.set(0.23, 0.22, zOff);
      head.add(eye);
    });
  } else {
    // Lyra mage crown + emerald hair
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.032, 8, 18), trimMat);
    crown.rotation.x = Math.PI / 2;
    crown.rotation.z = -0.18;
    crown.position.y = 0.36;
    head.add(crown);

    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), glowMat);
    gem.position.set(0.2, 0.38, 0);
    head.add(gem);
  }

  // Arms & Pauldrons
  const leftArm = new THREE.Group();
  leftArm.position.set(0, 0.62, isTitan ? -0.58 : -0.4);
  const rightArm = new THREE.Group();
  rightArm.position.set(0, 0.62, isTitan ? 0.58 : 0.4);
  torso.add(leftArm, rightArm);

  [leftArm, rightArm].forEach((arm, idx) => {
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(isTitan ? 0.24 : 0.15, 12, 10),
      trimMat,
    );
    pauldron.scale.set(1.1, 0.85, 1.1);
    pauldron.castShadow = true;
    arm.add(pauldron);

    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(isTitan ? 0.13 : 0.085, 0.32, 4, 8),
      armorMat,
    );
    upperArm.position.y = -0.24;
    upperArm.castShadow = true;
    arm.add(upperArm);

    const gauntlet = new THREE.Mesh(
      new THREE.CylinderGeometry(isTitan ? 0.14 : 0.095, isTitan ? 0.12 : 0.08, 0.24, 10),
      idx === 1 ? trimMat : clothMat,
    );
    gauntlet.position.y = -0.48;
    gauntlet.castShadow = true;
    arm.add(gauntlet);
  });

  // Weapon Pivot attached to rightArm (and secondary dagger on leftArm for Vespera)
  const weaponPivot = new THREE.Group();
  weaponPivot.position.set(0.08, -0.56, 0);
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
  } else {
    // Lyra wind staff
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 1.45, 10), trimMat);
    staff.rotation.z = -Math.PI / 2.2;
    staff.position.set(0.42, 0.15, 0);
    staff.castShadow = true;
    weaponPivot.add(staff);

    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 1), glowMat);
    orb.position.set(1.06, 0.34, 0);
    weaponPivot.add(orb);
  }

  // Accent accessory (cape / wings / halo / backplate)
  const accentAccessory = new THREE.Group();
  accentAccessory.position.set(-0.28, 0.56, 0);
  torso.add(accentAccessory);

  if (fighterId === 'kael') {
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.78, 0.52), clothMat);
    cape.position.set(-0.08, -0.35, 0);
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
  } else {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.032, 8, 24), glowMat);
    halo.rotation.y = Math.PI / 2;
    halo.position.set(-0.16, 0.04, 0);
    accentAccessory.add(halo);
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
