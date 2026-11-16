import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SoundEngine } from './audio';
import { FIGHTERS, STAGES } from './data';
import { buildFighterRig, buildStageVisuals, disposeObject3D, type FighterRig, type StageVisuals } from './models';
import { createProceduralTextures, type ProceduralTextureSet } from './textures';
import type {
  FighterActionState,
  FighterHudState,
  FighterId,
  FighterProfile,
  HudSnapshot,
  MatchBanner,
  MatchStats,
  StageId,
  StageProfile,
} from './types';

export type EngineViewMode = 'title' | 'select' | 'combat';

interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shield: boolean;
  jumpBuffer: number;
  lightBuffer: number;
  smashBuffer: number;
  specialBuffer: number;
  upSpecialBuffer: number;
}

interface ActivePlatformState {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  width: number;
  thickness: number;
  oneWay: boolean;
}

interface FighterRuntime {
  isPlayer: boolean;
  profileId: FighterId;
  rig: FighterRig;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  groundedPlatformId: string | null;
  coyoteTimer: number;
  dropThroughTimer: number;
  jumpsLeft: number;
  upSpecialUsed: boolean;
  damage: number;
  stocks: number;
  maxStocks: number;
  shield: number;
  shieldBrokenTimer: number;
  invulnTimer: number;
  action: FighterActionState;
  actionTimer: number;
  actionDuration: number;
  attackHitConfirmed: boolean;
  attackDir: 'side' | 'up' | 'down' | 'neutral';
  hitstunTimer: number;
  hitFlashTimer: number;
  squashX: number;
  squashY: number;
  animTime: number;
  lastHitTimestamp: number;
  respawnTimer: number;
  // AI internal state
  aiDecisionTimer: number;
  aiDesiredMove: -1 | 0 | 1;
  aiWantsShield: boolean;
}

interface Projectile {
  active: boolean;
  ownerIsPlayer: boolean;
  fighterId: FighterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  knockback: number;
  life: number;
  mesh: THREE.Mesh;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  mesh: THREE.Sprite;
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onMatchEnd: (playerWon: boolean, stats: MatchStats) => void;
  onPauseToggle: () => void;
  onContextLost?: (lost: boolean) => void;
}

const FIXED_DT = 1 / 60;
const MAX_STOCKS = 3;
const _projVec = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 2.2, 0);

export class SmashGameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  public sound: SoundEngine;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private textures!: ProceduralTextureSet;
  private isSoftwareGl = false;

  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.DirectionalLight;
  private fog!: THREE.FogExp2;

  private stageVisuals: StageVisuals | null = null;
  private currentStage: StageProfile = STAGES.sky_temple;
  private platformStates: ActivePlatformState[] = [];

  private fighters: [FighterRuntime | null, FighterRuntime | null] = [null, null];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];

  private viewMode: EngineViewMode = 'title';
  private paused = false;
  private matchEnded = false;
  private aiLevel = 1;

  private elapsedTotal = 0;
  private matchElapsed = 0;
  private countdownTimer = 0;
  private hitstopTimer = 0;
  private cameraTrauma = 0;
  private banner: MatchBanner | null = null;
  private bannerTimer = 0;
  private hudSyncTimer = 0;

  private stats: MatchStats = {
    durationSec: 0,
    playerKOs: 0,
    aiKOs: 0,
    playerMaxDamage: 0,
    aiMaxDamage: 0,
    damageDealt: 0,
  };

  private playerInput: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    shield: false,
    jumpBuffer: 0,
    lightBuffer: 0,
    smashBuffer: 0,
    specialBuffer: 0,
    upSpecialBuffer: 0,
  };

  private aiInput: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    shield: false,
    jumpBuffer: 0,
    lightBuffer: 0,
    smashBuffer: 0,
    specialBuffer: 0,
    upSpecialBuffer: 0,
  };

  private selectStageId: StageId = 'sky_temple';
  private selectPlayerId: FighterId = 'kael';
  private selectShowcaseRig: FighterRig | null = null;
  private selectPedestal: THREE.Group | null = null;
  private selectSpinAngle = 0.35;

  private heldKeys = new Set<string>();
  private frameId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private disposed = false;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.sound = new SoundEngine();

    this.initRendererAndScene();
    this.initParticlePool();
    this.bindEvents();
    this.setupTitleScene();

    this.lastTime = performance.now();
    this.scheduleNextFrame();
  }

  private detectSoftwareWebGL(): boolean {
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private initRendererAndScene(): void {
    this.isSoftwareGl = this.detectSoftwareWebGL();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.2, 220);
    this.camera.position.set(0, 4.5, 22);

    // Mandatory studio environment reflection on every device
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.textures = createProceduralTextures(this.renderer.capabilities.getMaxAnisotropy());

    // 3-point warm/cool lighting rig
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x3f6212, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    this.sunLight.position.set(10, 18, 12);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 55;
    this.sunLight.shadow.camera.left = -16;
    this.sunLight.shadow.camera.right = 16;
    this.sunLight.shadow.camera.top = 14;
    this.sunLight.shadow.camera.bottom = -10;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight(0x60a5fa, 0.9);
    this.rimLight.position.set(-10, 8, -12);
    this.scene.add(this.rimLight);

    this.fog = new THREE.FogExp2(0xbae6fd, 0.014);
    this.scene.fog = this.fog;

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private initParticlePool(): void {
    for (let i = 0; i < 64; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.textures.sparkSprite,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      this.scene.add(sprite);
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.3,
        scale: 1,
        mesh: sprite,
      });
    }
  }

  private spawnParticles(
    x: number,
    y: number,
    z: number,
    colorHex: number,
    count: number,
    speed: number,
    scale = 0.55,
  ): void {
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.z = z;
        const ang = Math.random() * Math.PI * 2;
        const spd = speed * (0.45 + Math.random() * 0.75);
        p.vx = Math.cos(ang) * spd;
        p.vy = Math.sin(ang) * spd + 1.5;
        p.vz = (Math.random() - 0.5) * spd * 0.6;
        p.maxLife = 0.22 + Math.random() * 0.24;
        p.life = p.maxLife;
        p.scale = scale * (0.7 + Math.random() * 0.6);
        p.mesh.material.color.setHex(colorHex);
        p.mesh.material.opacity = 1;
        p.mesh.position.set(x, y, z);
        p.mesh.scale.setScalar(p.scale);
        p.mesh.visible = true;
        spawned++;
      }
    }
  }

  private clearProjectiles(): void {
    for (const proj of this.projectiles) {
      this.scene.remove(proj.mesh);
      proj.mesh.geometry.dispose();
      (proj.mesh.material as THREE.Material).dispose();
    }
    this.projectiles = [];
  }

  private clearFighters(): void {
    this.fighters.forEach((f, idx) => {
      if (f) {
        this.scene.remove(f.rig.root);
        disposeObject3D(f.rig.root);
        this.fighters[idx] = null;
      }
    });
  }

  private clearShowcase(): void {
    if (this.selectShowcaseRig) {
      this.scene.remove(this.selectShowcaseRig.root);
      disposeObject3D(this.selectShowcaseRig.root);
      this.selectShowcaseRig = null;
    }
    if (this.selectPedestal) {
      this.scene.remove(this.selectPedestal);
      disposeObject3D(this.selectPedestal);
      this.selectPedestal = null;
    }
  }

  private loadStage(stageId: StageId): void {
    if (this.stageVisuals) {
      this.scene.remove(this.stageVisuals.root);
      disposeObject3D(this.stageVisuals.root);
      this.stageVisuals = null;
    }

    const stage = STAGES[stageId];
    this.currentStage = stage;
    this.stageVisuals = buildStageVisuals(stage, this.textures);
    this.scene.add(this.stageVisuals.root);

    this.platformStates = stage.platforms.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      dx: 0,
      dy: 0,
      width: p.width,
      thickness: p.thickness,
      oneWay: p.oneWay,
    }));

    // Atmosphere & lighting sync
    this.scene.background = new THREE.Color(stage.skyBottomColor);
    this.fog.color.set(stage.fogColor);
    this.fog.density = stageId === 'golden_summit' ? 0.018 : 0.013;
    this.sunLight.color.set(stage.sunColor);
    this.hemiLight.color.set(stage.hemiSkyColor);
    this.hemiLight.groundColor.set(stage.hemiGroundColor);
  }

  private createFighterRuntime(
    profileId: FighterId,
    isPlayer: boolean,
    spawnX: number,
    spawnY: number,
  ): FighterRuntime {
    const rig = buildFighterRig(profileId, isPlayer, this.textures);
    rig.root.position.set(spawnX, spawnY, 0);
    this.scene.add(rig.root);

    return {
      isPlayer,
      profileId,
      rig,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      facing: isPlayer ? 1 : -1,
      grounded: false,
      groundedPlatformId: null,
      coyoteTimer: 0,
      dropThroughTimer: 0,
      jumpsLeft: 2,
      upSpecialUsed: false,
      damage: 0,
      stocks: MAX_STOCKS,
      maxStocks: MAX_STOCKS,
      shield: 100,
      shieldBrokenTimer: 0,
      invulnTimer: 0,
      action: 'fall',
      actionTimer: 0,
      actionDuration: 0,
      attackHitConfirmed: false,
      attackDir: 'neutral',
      hitstunTimer: 0,
      hitFlashTimer: 0,
      squashX: 1,
      squashY: 1,
      animTime: 0,
      lastHitTimestamp: 0,
      respawnTimer: 0,
      aiDecisionTimer: 0.15,
      aiDesiredMove: 0,
      aiWantsShield: false,
    };
  }

  // ==================== PUBLIC SCENE MODES ====================

  public setupTitleScene(): void {
    this.viewMode = 'title';
    this.paused = false;
    this.matchEnded = false;
    this.clearProjectiles();
    this.clearShowcase();
    this.clearFighters();
    this.loadStage('sky_temple');

    // Place two heroic fighters idling on the Sky Temple for a living title backdrop
    this.fighters[0] = this.createFighterRuntime('kael', true, -3.2, 0);
    this.fighters[1] = this.createFighterRuntime('vespera', false, 3.2, 0);
    if (this.fighters[0]) {
      this.fighters[0].grounded = true;
      this.fighters[0].action = 'idle';
    }
    if (this.fighters[1]) {
      this.fighters[1].grounded = true;
      this.fighters[1].action = 'idle';
    }
  }

  public setupSelectScene(playerId: FighterId, stageId: StageId): void {
    this.viewMode = 'select';
    this.paused = false;
    this.matchEnded = false;
    this.clearProjectiles();
    this.clearFighters();

    if (this.selectStageId !== stageId || !this.stageVisuals) {
      this.selectStageId = stageId;
      this.loadStage(stageId);
    }

    if (!this.selectPedestal) {
      const ped = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.75, 2.0, 0.45, 24),
        new THREE.MeshStandardMaterial({
          map: this.textures.marbleTile,
          color: 0xe2e8f0,
          roughness: 0.35,
          metalness: 0.2,
        }),
      );
      base.position.y = 0.22;
      base.receiveShadow = true;
      ped.add(base);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.72, 0.06, 8, 32),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          emissiveIntensity: 1.4,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.44;
      ped.add(ring);
      ped.position.set(2.4, 0, 1.5);
      this.scene.add(ped);
      this.selectPedestal = ped;
    }

    if (this.selectPlayerId !== playerId || !this.selectShowcaseRig) {
      this.selectPlayerId = playerId;
      if (this.selectShowcaseRig) {
        this.scene.remove(this.selectShowcaseRig.root);
        disposeObject3D(this.selectShowcaseRig.root);
      }
      this.selectShowcaseRig = buildFighterRig(playerId, true, this.textures);
      this.selectShowcaseRig.root.position.set(2.4, 0.45, 1.5);
      this.selectShowcaseRig.root.scale.setScalar(1.22);
      this.selectShowcaseRig.playerRing.visible = false;
      this.scene.add(this.selectShowcaseRig.root);
      this.selectSpinAngle = 0.35;
    }
  }

  public startMatch(
    playerId: FighterId,
    opponentId: FighterId,
    stageId: StageId,
    aiLevel: number,
    roundLabel?: string,
  ): void {
    this.sound.unlock();
    this.viewMode = 'combat';
    this.paused = false;
    this.matchEnded = false;
    this.aiLevel = aiLevel;
    this.matchElapsed = 0;
    this.hitstopTimer = 0;
    this.cameraTrauma = 0;
    this.countdownTimer = 1.65;
    this.banner = {
      text: '¡LISTOS!',
      subtext: roundLabel,
      tone: 'neutral',
    };
    this.bannerTimer = 1.25;

    this.stats = {
      durationSec: 0,
      playerKOs: 0,
      aiKOs: 0,
      playerMaxDamage: 0,
      aiMaxDamage: 0,
      damageDealt: 0,
    };

    this.clearShowcase();
    this.clearProjectiles();
    this.clearFighters();
    this.loadStage(stageId);

    const [pSpawn, aiSpawn] = this.currentStage.spawnPoints;
    this.fighters[0] = this.createFighterRuntime(playerId, true, pSpawn.x, pSpawn.y);
    this.fighters[1] = this.createFighterRuntime(opponentId, false, aiSpawn.x, aiSpawn.y);

    this.resetInput(this.playerInput);
    this.resetInput(this.aiInput);
    this.sound.playCountdown(false);
    this.emitHudSnapshot();
  }

  public setPaused(paused: boolean): void {
    if (this.viewMode !== 'combat' || this.matchEnded) return;
    this.paused = paused;
    if (paused) {
      this.heldKeys.clear();
      this.resetInput(this.playerInput);
    }
  }

  private resetInput(inp: InputState): void {
    inp.left = false;
    inp.right = false;
    inp.up = false;
    inp.down = false;
    inp.shield = false;
    inp.jumpBuffer = 0;
    inp.lightBuffer = 0;
    inp.smashBuffer = 0;
    inp.specialBuffer = 0;
    inp.upSpecialBuffer = 0;
  }

  // ==================== INPUT HANDLING ====================

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.viewMode !== 'combat') return;

    if (e.code === 'Escape') {
      e.preventDefault();
      if (!this.matchEnded) {
        this.callbacks.onPauseToggle();
      }
      return;
    }

    if (this.paused || this.matchEnded) return;

    const wasHeld = this.heldKeys.has(e.code);
    this.heldKeys.add(e.code);
    this.sound.unlock();

    if (
      ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)
    ) {
      e.preventDefault();
    }

    // Continuous directions
    this.syncHeldDirections();

    // Edge-triggered actions with 120ms input buffer
    if (!wasHeld) {
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.playerInput.jumpBuffer = 0.13;
      }
      if (e.code === 'KeyJ' || e.code === 'KeyZ') {
        this.playerInput.lightBuffer = 0.13;
      }
      if (e.code === 'KeyK' || e.code === 'KeyX') {
        this.playerInput.smashBuffer = 0.14;
      }
      if (e.code === 'KeyU' || e.code === 'KeyC') {
        if (this.playerInput.up) {
          this.playerInput.upSpecialBuffer = 0.14;
        } else {
          this.playerInput.specialBuffer = 0.14;
        }
      }
      if (e.code === 'KeyI') {
        this.playerInput.upSpecialBuffer = 0.14;
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
    this.syncHeldDirections();
  };

  private handleBlur = (): void => {
    this.heldKeys.clear();
    this.resetInput(this.playerInput);
  };

  private syncHeldDirections(): void {
    this.playerInput.left = this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft');
    this.playerInput.right = this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight');
    this.playerInput.up = this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp');
    this.playerInput.down = this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown');
    this.playerInput.shield =
      this.heldKeys.has('ShiftLeft') ||
      this.heldKeys.has('ShiftRight') ||
      this.heldKeys.has('KeyL') ||
      this.heldKeys.has('KeyV');
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.callbacks.onContextLost?.(true);
  };

  private handleContextRestored = (): void => {
    this.callbacks.onContextLost?.(false);
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  // ==================== MAIN LOOP ====================

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick());
    } else {
      this.frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick(): void {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = Math.max(0, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // Clamp frame delta time

    this.elapsedTotal += dt;

    // Update animated stage background props
    if (this.stageVisuals) {
      for (const animFn of this.stageVisuals.animatedProps) {
        animFn(this.elapsedTotal);
      }
    }

    if (this.viewMode === 'title') {
      this.updateTitleCameraAndFighters(dt);
    } else if (this.viewMode === 'select') {
      this.updateSelectShowcase(dt);
    } else if (this.viewMode === 'combat') {
      this.updateCombatFrame(dt);
    }

    this.updateParticles(dt);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  }

  private updateTitleCameraAndFighters(dt: number): void {
    const angle = this.elapsedTotal * 0.22;
    _targetCamPos.set(Math.sin(angle) * 18, 5.4 + Math.sin(angle * 0.7) * 1.1, Math.cos(angle) * 18);
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _targetCamPos.x, 4, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _targetCamPos.y, 4, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _targetCamPos.z, 4, dt);
    _currentLookAt.set(0, 1.8, 0);
    this.camera.lookAt(_currentLookAt);

    this.fighters.forEach((f) => {
      if (!f) return;
      f.animTime += dt;
      this.animateFighterRig(f, dt);
    });
  }

  private updateSelectShowcase(dt: number): void {
    _targetCamPos.set(0.4, 3.1, 10.5);
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _targetCamPos.x, 5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _targetCamPos.y, 5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _targetCamPos.z, 5, dt);
    _targetLookAt.set(1.3, 2.0, 1.0);
    _currentLookAt.lerp(_targetLookAt, 1 - Math.exp(-6 * dt));
    this.camera.lookAt(_currentLookAt);

    if (this.selectShowcaseRig) {
      this.selectSpinAngle += dt * 0.75;
      this.selectShowcaseRig.root.rotation.y = this.selectSpinAngle;
      const bob = Math.sin(this.elapsedTotal * 3.2) * 0.05;
      this.selectShowcaseRig.torso.position.y = 0.75 + bob;
      this.selectShowcaseRig.rightArm.rotation.z = 0.2 + Math.sin(this.elapsedTotal * 2.5) * 0.08;
      this.selectShowcaseRig.leftArm.rotation.z = -0.2 - Math.sin(this.elapsedTotal * 2.5) * 0.08;
      this.selectShowcaseRig.accentAccessory.rotation.z = Math.sin(this.elapsedTotal * 4.5) * 0.1;
    }
  }

  private updateCombatFrame(dt: number): void {
    if (this.paused) {
      this.updateCombatCamera(dt);
      return;
    }

    // Banner timer
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.banner = null;
      }
    }

    // Countdown before match starts
    if (this.countdownTimer > 0) {
      const prev = this.countdownTimer;
      this.countdownTimer -= dt;
      if (prev > 0.65 && this.countdownTimer <= 0.65) {
        this.banner = { text: '¡COMBATE!', tone: 'neutral' };
        this.bannerTimer = 0.85;
        this.sound.playCountdown(true);
      }
      this.updateMovingPlatforms(dt);
      this.fighters.forEach((f) => {
        if (f) {
          f.animTime += dt;
          this.animateFighterRig(f, dt);
        }
      });
      this.updateCombatCamera(dt);
      this.emitHudSnapshot();
      return;
    }

    // Hitstop freeze frames on heavy impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateCombatCamera(dt);
      return;
    }

    if (!this.matchEnded) {
      this.matchElapsed += dt;
      this.stats.durationSec = this.matchElapsed;
    }

    this.accumulator += dt;
    while (this.accumulator >= FIXED_DT) {
      this.stepSimulation(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    // Visual rig sync & animations
    this.fighters.forEach((f) => {
      if (!f) return;
      f.animTime += dt;
      this.animateFighterRig(f, dt);
    });

    this.updateCombatCamera(dt);

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.04) {
      this.hudSyncTimer = 0;
      this.emitHudSnapshot();
    }
  }

  private updateMovingPlatforms(dt: number): void {
    const time = this.elapsedTotal;
    for (let i = 0; i < this.currentStage.platforms.length; i++) {
      const def = this.currentStage.platforms[i];
      const st = this.platformStates[i];
      const prevX = st.x;
      const prevY = st.y;
      if (def.moveAxis && def.moveAmplitude && def.moveSpeed) {
        const offset = Math.sin(time * def.moveSpeed + (def.movePhase || 0)) * def.moveAmplitude;
        st.x = def.moveAxis === 'x' ? def.x + offset : def.x;
        st.y = def.moveAxis === 'y' ? def.y + offset : def.y;
      } else {
        st.x = def.x;
        st.y = def.y;
      }
      st.dx = st.x - prevX;
      st.dy = st.y - prevY;

      const group = this.stageVisuals?.platformGroups.get(def.id);
      if (group) {
        group.position.set(st.x, st.y, 0);
      }
    }
  }

  private stepSimulation(dt: number): void {
    this.updateMovingPlatforms(dt);

    const p1 = this.fighters[0];
    const p2 = this.fighters[1];
    if (!p1 || !p2) return;

    if (!this.matchEnded) {
      this.updateAiController(p2, p1, dt);
      this.stepFighter(p1, p2, this.playerInput, dt);
      this.stepFighter(p2, p1, this.aiInput, dt);
      this.stepProjectiles(p1, p2, dt);
      this.checkBlastZones(p1, p2);
      this.checkBlastZones(p2, p1);
    }
  }

  private decrementBuffers(inp: InputState, dt: number): void {
    inp.jumpBuffer = Math.max(0, inp.jumpBuffer - dt);
    inp.lightBuffer = Math.max(0, inp.lightBuffer - dt);
    inp.smashBuffer = Math.max(0, inp.smashBuffer - dt);
    inp.specialBuffer = Math.max(0, inp.specialBuffer - dt);
    inp.upSpecialBuffer = Math.max(0, inp.upSpecialBuffer - dt);
  }

  private stepFighter(
    f: FighterRuntime,
    opp: FighterRuntime,
    inp: InputState,
    dt: number,
  ): void {
    const profile = FIGHTERS[f.profileId];
    this.decrementBuffers(inp, dt);

    // Hit flash decay
    if (f.hitFlashTimer > 0) {
      f.hitFlashTimer = Math.max(0, f.hitFlashTimer - dt);
    }

    // Invulnerability decay
    if (f.invulnTimer > 0) {
      f.invulnTimer = Math.max(0, f.invulnTimer - dt);
    }

    // Squash & stretch elastic return
    f.squashX = THREE.MathUtils.damp(f.squashX, 1, 14, dt);
    f.squashY = THREE.MathUtils.damp(f.squashY, 1, 14, dt);

    // Respawn descent
    if (f.action === 'respawn') {
      f.respawnTimer -= dt;
      f.vy = -4.0;
      f.y += f.vy * dt;
      f.vx = 0;
      if (f.respawnTimer <= 0 || f.y <= 3.8) {
        f.action = 'fall';
        f.vy = 0;
      }
      f.rig.root.position.set(f.x, f.y, 0);
      return;
    }

    // Carry by moving platform
    if (f.grounded && f.groundedPlatformId) {
      const plat = this.platformStates.find((p) => p.id === f.groundedPlatformId);
      if (plat) {
        f.x += plat.dx;
        f.y += plat.dy;
      }
    }

    // Shield regen when not shielding
    if (f.action !== 'shield') {
      f.shield = Math.min(100, f.shield + 14 * dt);
    }

    // Dizzy (shield break) state
    if (f.action === 'dizzy') {
      f.shieldBrokenTimer -= dt;
      f.vx *= Math.pow(0.08, dt);
      this.applyGravityAndPlatforms(f, profile, dt);
      if (f.shieldBrokenTimer <= 0) {
        f.shield = 60;
        f.action = f.grounded ? 'idle' : 'fall';
      }
      return;
    }

    // Hitstun state
    if (f.action === 'hitstun') {
      f.hitstunTimer -= dt;
      // Air drag in hitstun
      f.vx *= Math.pow(0.45, dt);
      this.applyGravityAndPlatforms(f, profile, dt);
      if (f.hitstunTimer <= 0) {
        f.action = f.grounded ? 'idle' : 'fall';
      }
      return;
    }

    // Dodge state
    if (f.action === 'dodge') {
      f.actionTimer -= dt;
      f.vx *= Math.pow(0.18, dt);
      this.applyGravityAndPlatforms(f, profile, dt);
      if (f.actionTimer <= 0) {
        f.action = f.grounded ? 'idle' : 'fall';
      }
      return;
    }

    // Attack / Special active states
    if (
      f.action === 'light' ||
      f.action === 'smash_charge' ||
      f.action === 'smash' ||
      f.action === 'special' ||
      f.action === 'up_special'
    ) {
      f.actionTimer -= dt;

      if (f.action === 'smash_charge') {
        f.vx *= Math.pow(0.05, dt);
        if (f.actionTimer <= 0) {
          f.action = 'smash';
          f.actionDuration = 0.28;
          f.actionTimer = 0.28;
          f.attackHitConfirmed = false;
          this.sound.playSwing(true);
          f.vx = f.facing * 4.5;
        }
      } else {
        // Active strike window check
        const elapsedInMove = f.actionDuration - f.actionTimer;
        if (!f.attackHitConfirmed && elapsedInMove >= 0.05 && elapsedInMove <= f.actionDuration * 0.65) {
          this.evaluateMeleeHit(f, opp);
        }

        if (f.action === 'up_special') {
          f.vx = THREE.MathUtils.lerp(
            f.vx,
            (inp.right ? 1 : inp.left ? -1 : 0) * profile.airSpeed * 0.7,
            dt * 5,
          );
        } else if (f.grounded) {
          f.vx *= Math.pow(0.04, dt);
        } else {
          // Slight air drift during aerials
          const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
          f.vx = THREE.MathUtils.lerp(f.vx, dir * profile.airSpeed * 0.85, dt * 4);
        }
      }

      this.applyGravityAndPlatforms(f, profile, dt);

      if (f.actionTimer <= 0 && f.action !== 'smash_charge') {
        f.action = f.grounded ? 'idle' : 'fall';
      }
      return;
    }

    // Shielding (on ground) or Air Dodge (in air)
    if (inp.shield && f.shield > 8) {
      if (f.grounded) {
        f.action = 'shield';
        f.vx *= Math.pow(0.02, dt);
        f.shield = Math.max(0, f.shield - 18 * dt);
        if (f.shield <= 1) {
          f.action = 'dizzy';
          f.shieldBrokenTimer = 2.2;
          this.sound.playShieldBreak();
          this.spawnParticles(f.x, f.y + 1.1, 0, 0xfbbf24, 14, 7, 0.7);
        }
        this.applyGravityAndPlatforms(f, profile, dt);
        return;
      } else if (f.coyoteTimer <= 0 && f.shield > 28) {
        // Air dodge!
        f.action = 'dodge';
        f.actionTimer = 0.24;
        f.invulnTimer = 0.22;
        f.shield = Math.max(0, f.shield - 28);
        const dirX = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        const dirY = (inp.up ? 1 : 0) - (inp.down ? 1 : 0);
        f.vx = dirX * 13.5;
        f.vy = dirY * 10.5 + 2.5;
        this.sound.playSwing(false);
        this.spawnParticles(f.x, f.y + 1, 0, 0x94a3b8, 6, 4, 0.45);
        this.applyGravityAndPlatforms(f, profile, dt);
        return;
      }
    }

    // Normal Ground & Air Movement
    const moveDir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (moveDir !== 0) {
      f.facing = moveDir > 0 ? 1 : -1;
      const targetSpeed = moveDir * (f.grounded ? profile.runSpeed : profile.airSpeed);
      const accel = f.grounded ? 18 : 10;
      f.vx = THREE.MathUtils.lerp(f.vx, targetSpeed, 1 - Math.exp(-accel * dt));
    } else {
      const friction = f.grounded ? 16 : 3.2;
      f.vx = THREE.MathUtils.lerp(f.vx, 0, 1 - Math.exp(-friction * dt));
    }

    // Drop through one-way platform
    if (f.grounded && inp.down) {
      const plat = this.platformStates.find((p) => p.id === f.groundedPlatformId);
      if (plat?.oneWay) {
        f.dropThroughTimer = 0.22;
        f.grounded = false;
        f.groundedPlatformId = null;
        f.y -= 0.08;
        f.vy = -3.5;
      }
    }

    // Jump & Double Jump (with Coyote Time + Jump Buffer)
    if (inp.jumpBuffer > 0) {
      if (f.grounded || f.coyoteTimer > 0) {
        inp.jumpBuffer = 0;
        f.grounded = false;
        f.groundedPlatformId = null;
        f.coyoteTimer = 0;
        f.vy = profile.jumpForce;
        f.jumpsLeft = 1;
        f.squashX = 0.78;
        f.squashY = 1.26;
        this.sound.playJump(false);
        this.spawnParticles(f.x, f.y + 0.1, 0, 0xe2e8f0, 5, 3.5, 0.4);
      } else if (f.jumpsLeft > 0) {
        inp.jumpBuffer = 0;
        f.vy = profile.doubleJumpForce;
        f.jumpsLeft--;
        f.squashX = 0.8;
        f.squashY = 1.24;
        this.sound.playJump(true);
        this.spawnParticles(f.x, f.y + 0.15, 0, 0x38bdf8, 8, 4.5, 0.5);
      }
    }

    // Attack Triggers
    if (inp.upSpecialBuffer > 0 && !f.upSpecialUsed) {
      inp.upSpecialBuffer = 0;
      this.startUpSpecial(f, profile, moveDir);
      this.applyGravityAndPlatforms(f, profile, dt);
      return;
    }

    if (inp.specialBuffer > 0) {
      inp.specialBuffer = 0;
      this.startNeutralSpecial(f, profile);
      this.applyGravityAndPlatforms(f, profile, dt);
      return;
    }

    if (inp.smashBuffer > 0) {
      inp.smashBuffer = 0;
      f.action = 'smash_charge';
      f.actionDuration = 0.16; // Crisp windup telegraph!
      f.actionTimer = 0.16;
      f.attackDir = inp.up ? 'up' : inp.down ? 'down' : 'side';
      f.squashX = 1.2;
      f.squashY = 0.82;
      this.spawnParticles(f.x, f.y + 0.9, 0, 0xfbbf24, 6, 4.5, 0.55);
      this.applyGravityAndPlatforms(f, profile, dt);
      return;
    }

    if (inp.lightBuffer > 0) {
      inp.lightBuffer = 0;
      f.action = 'light';
      f.actionDuration = 0.2;
      f.actionTimer = 0.2;
      f.attackHitConfirmed = false;
      f.attackDir = inp.up ? 'up' : inp.down ? 'down' : 'side';
      this.sound.playSwing(false);
      this.applyGravityAndPlatforms(f, profile, dt);
      return;
    }

    // Fast fall
    if (!f.grounded && inp.down && f.vy < 2) {
      f.vy = Math.min(f.vy, -profile.fallSpeedMax * 0.95);
    }

    this.applyGravityAndPlatforms(f, profile, dt);

    // Update idle/run/jump/fall state
    if (f.grounded) {
      f.action = Math.abs(f.vx) > 0.7 ? 'run' : 'idle';
    } else {
      f.action = f.vy > 0.5 ? 'jump' : 'fall';
    }
  }

  private startNeutralSpecial(f: FighterRuntime, _profile: FighterProfile): void {
    f.action = 'special';
    f.actionDuration = 0.34;
    f.actionTimer = 0.34;
    f.attackHitConfirmed = false;
    f.attackDir = 'neutral';
    this.sound.playSpecial(f.profileId);

    if (f.profileId === 'kael' || f.profileId === 'lyra') {
      // Spawn energy projectile
      const isKael = f.profileId === 'kael';
      const geo = isKael
        ? new THREE.SphereGeometry(0.32, 12, 10)
        : new THREE.TorusGeometry(0.34, 0.11, 8, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: isKael ? 0xfb923c : 0x34d399,
        emissive: isKael ? 0xf97316 : 0x10b981,
        emissiveIntensity: 2.0,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(f.x + f.facing * 0.95, f.y + 1.05, 0);
      this.scene.add(mesh);
      this.projectiles.push({
        active: true,
        ownerIsPlayer: f.isPlayer,
        fighterId: f.profileId,
        x: f.x + f.facing * 0.95,
        y: f.y + 1.05,
        vx: f.facing * (isKael ? 15.5 : 17.5),
        vy: 0,
        radius: 0.55,
        damage: isKael ? 10 : 8,
        knockback: isKael ? 9.5 : 10.5,
        life: 1.35,
        mesh,
      });
      this.spawnParticles(f.x + f.facing * 0.9, f.y + 1.05, 0, isKael ? 0xf97316 : 0x34d399, 8, 5, 0.55);
    } else if (f.profileId === 'vespera') {
      // Shadow Blink Dash!
      f.vx = f.facing * 20;
      f.vy = Math.max(0, f.vy * 0.2);
      this.spawnParticles(f.x, f.y + 1.0, 0, 0x22d3ee, 12, 7, 0.65);
    } else {
      // Titan-G Seismic Slam!
      f.vy = f.grounded ? 4.5 : -14;
      f.vx = 0;
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.35);
      this.spawnParticles(f.x, f.y + 0.2, 0, 0xf59e0b, 16, 8.5, 0.7);
    }
  }

  private startUpSpecial(f: FighterRuntime, profile: FighterProfile, moveDir: number): void {
    f.action = 'up_special';
    f.actionDuration = 0.38;
    f.actionTimer = 0.38;
    f.attackHitConfirmed = false;
    f.attackDir = 'up';
    f.grounded = false;
    f.groundedPlatformId = null;
    f.upSpecialUsed = true;
    f.vy = profile.upSpecialBoost;
    if (moveDir !== 0) {
      f.facing = moveDir > 0 ? 1 : -1;
      f.vx = moveDir * 7.5;
    } else {
      f.vx = f.facing * 3.5;
    }
    f.squashX = 0.72;
    f.squashY = 1.34;
    this.sound.playSpecial(f.profileId);
    const col = new THREE.Color(profile.emissiveColor).getHex();
    this.spawnParticles(f.x, f.y + 0.5, 0, col, 14, 7.5, 0.65);
  }

  private applyGravityAndPlatforms(
    f: FighterRuntime,
    profile: FighterProfile,
    dt: number,
  ): void {
    if (f.dropThroughTimer > 0) {
      f.dropThroughTimer = Math.max(0, f.dropThroughTimer - dt);
    }

    const prevY = f.y;
    f.vy = Math.max(-profile.fallSpeedMax, f.vy - profile.gravity * dt);
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    let landedPlat: ActivePlatformState | null = null;
    if (f.vy <= 0) {
      for (const plat of this.platformStates) {
        if (plat.oneWay && f.dropThroughTimer > 0) continue;
        const halfW = plat.width * 0.5 + 0.32; // slight ledge forgiveness
        if (f.x >= plat.x - halfW && f.x <= plat.x + halfW) {
          const platTop = plat.y;
          // Crossed top surface downward
          if (prevY >= platTop - 0.16 && f.y <= platTop + 0.05) {
            f.y = platTop;
            f.vy = 0;
            landedPlat = plat;
            break;
          }
        }
        // Solid underside / side wall bounce on main island
        if (!plat.oneWay) {
          const wallHalfW = plat.width * 0.5 + 0.38;
          if (
            f.y < plat.y - 0.15 &&
            f.y > plat.y - plat.thickness - 1.2 &&
            Math.abs(f.x - plat.x) < wallHalfW
          ) {
            f.x = f.x < plat.x ? plat.x - wallHalfW : plat.x + wallHalfW;
            f.vx = 0;
          }
        }
      }
    }

    if (landedPlat) {
      if (!f.grounded) {
        f.squashX = 1.22;
        f.squashY = 0.78;
        this.sound.playLand();
        this.spawnParticles(f.x, f.y + 0.05, 0, 0xe2e8f0, 4, 2.8, 0.35);
      }
      f.grounded = true;
      f.groundedPlatformId = landedPlat.id;
      f.coyoteTimer = 0.1;
      f.jumpsLeft = 2;
      f.upSpecialUsed = false;
    } else {
      if (f.grounded) {
        f.grounded = false;
        f.groundedPlatformId = null;
        f.coyoteTimer = 0.1;
      } else {
        f.coyoteTimer = Math.max(0, f.coyoteTimer - dt);
      }
    }
  }

  private evaluateMeleeHit(attacker: FighterRuntime, defender: FighterRuntime): void {
    if (defender.invulnTimer > 0 || defender.action === 'respawn' || defender.action === 'ko') {
      return;
    }

    const atkProfile = FIGHTERS[attacker.profileId];
    const isSmash = attacker.action === 'smash';
    const isSpecial = attacker.action === 'special' || attacker.action === 'up_special';

    const reach = isSmash
      ? atkProfile.smashRange
      : isSpecial
        ? atkProfile.smashRange * 0.95
        : atkProfile.lightRange;

    // Hitbox center offset
    let hx = attacker.x + attacker.facing * (reach * 0.55);
    let hy = attacker.y + 1.05;
    if (attacker.attackDir === 'up') {
      hx = attacker.x + attacker.facing * 0.3;
      hy = attacker.y + 1.75;
    } else if (attacker.attackDir === 'down') {
      hx = attacker.x;
      hy = attacker.y + 0.55;
    }

    const defCenterX = defender.x;
    const defCenterY = defender.y + 1.0;
    const dx = defCenterX - hx;
    const dy = defCenterY - hy;
    const hitRadius = isSmash ? 1.35 : 1.15;

    if (dx * dx + dy * dy <= hitRadius * hitRadius) {
      attacker.attackHitConfirmed = true;
      const baseDmg = isSmash
        ? atkProfile.smashDamage
        : isSpecial
          ? Math.round(atkProfile.smashDamage * 0.72)
          : atkProfile.lightDamage;
      const baseKb = isSmash
        ? atkProfile.smashKnockback
        : isSpecial
          ? atkProfile.smashKnockback * 0.85
          : atkProfile.lightKnockback;

      this.applyHit(
        attacker,
        defender,
        baseDmg,
        baseKb,
        attacker.attackDir,
        isSmash || isSpecial,
      );
    }
  }

  private applyHit(
    attacker: FighterRuntime | null,
    defender: FighterRuntime,
    damage: number,
    baseKnockback: number,
    dir: 'side' | 'up' | 'down' | 'neutral',
    isHeavy: boolean,
  ): void {
    // Shield check
    if (defender.action === 'shield') {
      defender.shield = Math.max(0, defender.shield - damage * 1.9);
      this.sound.playShieldClang();
      this.spawnParticles(defender.x, defender.y + 1.1, 0, 0x38bdf8, 8, 6, 0.5);
      const pushDir = attacker ? attacker.facing : defender.x >= 0 ? 1 : -1;
      defender.vx += pushDir * 4.5;
      if (defender.shield <= 1) {
        defender.action = 'dizzy';
        defender.shieldBrokenTimer = 2.2;
        this.sound.playShieldBreak();
      }
      return;
    }

    const defProfile = FIGHTERS[defender.profileId];
    defender.damage = Math.min(999, defender.damage + damage);
    defender.lastHitTimestamp = performance.now();

    if (attacker?.isPlayer) {
      this.stats.damageDealt += damage;
      this.stats.aiMaxDamage = Math.max(this.stats.aiMaxDamage, defender.damage);
    } else if (defender.isPlayer) {
      this.stats.playerMaxDamage = Math.max(this.stats.playerMaxDamage, defender.damage);
    }

    // Smash knockback formula scaled by % and weight
    const kb = (baseKnockback + defender.damage * 0.165) * (100 / defProfile.weight);
    const launchDirX = attacker
      ? defender.x >= attacker.x
        ? 1
        : -1
      : defender.vx >= 0
        ? 1
        : -1;

    let angleDeg = 36;
    if (dir === 'up') angleDeg = 76;
    else if (dir === 'down') angleDeg = 52;
    else if (!isHeavy) angleDeg = 26;

    const rad = THREE.MathUtils.degToRad(angleDeg);
    defender.vx = Math.cos(rad) * kb * launchDirX;
    defender.vy = Math.sin(rad) * kb;
    defender.grounded = false;
    defender.groundedPlatformId = null;
    defender.action = 'hitstun';
    defender.hitstunTimer = Math.min(0.85, 0.18 + kb * 0.018);
    defender.hitFlashTimer = 0.14;
    defender.squashX = 1.32;
    defender.squashY = 0.72;

    // Hitstop + Camera Shake + Audio + Particles
    if (isHeavy || kb > 16) {
      this.hitstopTimer = Math.min(0.075, 0.035 + kb * 0.0014);
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.35 + kb * 0.014);
    } else {
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.14);
    }

    this.sound.playHit(kb, isHeavy);
    this.spawnParticles(
      defender.x,
      defender.y + 1.05,
      0.3,
      isHeavy ? 0xfbbf24 : 0xffffff,
      isHeavy ? 18 : 10,
      isHeavy ? 11 : 7,
      isHeavy ? 0.85 : 0.55,
    );
  }

  private stepProjectiles(p1: FighterRuntime, p2: FighterRuntime, dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.mesh.position.set(proj.x, proj.y, 0);
      proj.mesh.rotation.z += dt * 10;
      proj.mesh.rotation.y += dt * 6;

      const target = proj.ownerIsPlayer ? p2 : p1;
      const attacker = proj.ownerIsPlayer ? p1 : p2;
      let remove = proj.life <= 0;

      if (
        !remove &&
        target.invulnTimer <= 0 &&
        target.action !== 'respawn' &&
        target.action !== 'dodge'
      ) {
        const dx = target.x - proj.x;
        const dy = target.y + 1.0 - proj.y;
        if (dx * dx + dy * dy <= (proj.radius + 0.7) ** 2) {
          this.applyHit(
            {
              ...attacker,
              facing: proj.vx >= 0 ? 1 : -1,
              x: proj.x,
            } as FighterRuntime,
            target,
            proj.damage,
            proj.knockback,
            'side',
            false,
          );
          remove = true;
        }
      }

      if (remove) {
        this.scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        (proj.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private checkBlastZones(f: FighterRuntime, opp: FighterRuntime): void {
    if (f.action === 'respawn' || this.matchEnded) return;
    const bz = this.currentStage.blastZones;
    const out =
      f.x < bz.left || f.x > bz.right || f.y < bz.bottom || f.y > bz.top;

    if (!out) return;

    // Ring-out explosion!
    this.sound.playRingOut();
    this.cameraTrauma = 0.85;
    const burstX = THREE.MathUtils.clamp(f.x, bz.left + 2, bz.right - 2);
    const burstY = THREE.MathUtils.clamp(f.y, bz.bottom + 2, bz.top - 2);
    this.spawnParticles(burstX, burstY, 0, f.isPlayer ? 0x38bdf8 : 0xf43f5e, 28, 15, 1.25);

    f.stocks = Math.max(0, f.stocks - 1);
    if (f.isPlayer) {
      this.stats.aiKOs += 1;
    } else {
      this.stats.playerKOs += 1;
    }

    if (f.stocks <= 0) {
      this.matchEnded = true;
      f.action = 'ko';
      f.rig.root.visible = false;
      const playerWon = !f.isPlayer;
      this.banner = {
        text: playerWon ? '¡VICTORIA!' : '¡DERROTA!',
        subtext: playerWon ? 'Rival fuera de combate' : 'Te has quedado sin vidas',
        tone: playerWon ? 'victory' : 'defeat',
      };
      this.bannerTimer = 3.0;
      if (playerWon) this.sound.playVictory();
      else this.sound.playDefeat();
      this.emitHudSnapshot();
      window.setTimeout(() => {
        if (!this.disposed) {
          this.callbacks.onMatchEnd(playerWon, { ...this.stats });
        }
      }, 950);
      return;
    }

    // Respawn on sky drop-in
    this.banner = {
      text: '¡K.O.!',
      subtext: f.isPlayer ? 'Jugador 1 pierde 1 vida' : '¡Rival expulsado!',
      tone: 'ko',
    };
    this.bannerTimer = 1.3;

    f.damage = 0;
    f.vx = 0;
    f.vy = 0;
    f.x = opp.x > 0 ? -2.2 : 2.2;
    f.y = 8.5;
    f.jumpsLeft = 2;
    f.upSpecialUsed = false;
    f.invulnTimer = 2.2;
    f.shield = 100;
    f.action = 'respawn';
    f.respawnTimer = 0.75;
    f.rig.root.position.set(f.x, f.y, 0);
  }

  // ==================== PROGRESSIVE AI CONTROLLER ====================

  private updateAiController(ai: FighterRuntime, player: FighterRuntime, dt: number): void {
    this.decrementBuffers(this.aiInput, dt);
    const level = this.aiLevel; // 1 to 5
    const reactionCadence = Math.max(0.055, 0.24 - level * 0.038);

    ai.aiDecisionTimer -= dt;
    if (ai.aiDecisionTimer > 0) {
      this.aiInput.left = ai.aiDesiredMove === -1;
      this.aiInput.right = ai.aiDesiredMove === 1;
      this.aiInput.shield = ai.aiWantsShield;
      return;
    }
    ai.aiDecisionTimer = reactionCadence * (0.85 + Math.random() * 0.3);

    const mainPlat = this.platformStates[0];
    const stageHalfW = mainPlat ? mainPlat.width * 0.46 : 7.5;
    const offStage = Math.abs(ai.x) > stageHalfW + 0.8 || ai.y < -0.6;

    // 1. High-priority Recovery when knocked offstage
    if (offStage && !ai.grounded) {
      ai.aiWantsShield = false;
      ai.aiDesiredMove = ai.x < 0 ? 1 : -1;
      this.aiInput.left = ai.aiDesiredMove === -1;
      this.aiInput.right = ai.aiDesiredMove === 1;
      this.aiInput.up = true;

      if (ai.y < 1.2 && ai.vy < 1.5) {
        if (ai.jumpsLeft > 0) {
          this.aiInput.jumpBuffer = 0.1;
        } else if (!ai.upSpecialUsed && level >= 2) {
          this.aiInput.upSpecialBuffer = 0.12;
        }
      }
      return;
    }

    this.aiInput.up = false;
    this.aiInput.down = false;

    const dx = player.x - ai.x;
    const dy = player.y - ai.y;
    const dist = Math.hypot(dx, dy);

    // 2. Reactive Shielding against player smashes on higher levels
    const playerAttacking =
      player.action === 'smash_charge' || player.action === 'smash' || player.action === 'light';
    if (playerAttacking && dist < 3.1 && ai.grounded && ai.shield > 28) {
      const shieldChance = Math.min(0.75, (level - 1) * 0.18);
      if (Math.random() < shieldChance) {
        ai.aiWantsShield = true;
        ai.aiDesiredMove = 0;
        this.aiInput.shield = true;
        return;
      }
    }
    ai.aiWantsShield = false;
    this.aiInput.shield = false;

    // 3. Movement & Platform Navigation (avoid walking off edges)
    const desiredSpacing = 1.65;
    if (Math.abs(dx) > desiredSpacing) {
      const moveToward = dx > 0 ? 1 : -1;
      if (ai.grounded && Math.abs(ai.x + moveToward * 1.1) > stageHalfW && Math.abs(player.x) > stageHalfW && level < 4) {
        ai.aiDesiredMove = 0; // Lower levels wait at ledge rather than edge-guarding
      } else {
        ai.aiDesiredMove = moveToward;
      }
    } else {
      ai.aiDesiredMove = 0;
      ai.facing = dx >= 0 ? 1 : -1;
    }

    // Jump to chase higher platforms or drop down to lower ones
    if (dy > 2.2 && ai.grounded && Math.random() < 0.35 + level * 0.1) {
      this.aiInput.jumpBuffer = 0.1;
    } else if (dy < -1.8 && ai.grounded && ai.groundedPlatformId !== 'main' && Math.random() < 0.45) {
      this.aiInput.down = true;
    }

    // 4. Offensive Attacks scaled by AI level
    const aggro = 0.28 + level * 0.14;
    if (dist < 2.6 && Math.abs(dy) < 1.8) {
      if (Math.random() < aggro) {
        // Use Smash to finish high-% targets!
        const smashBias = player.damage > 75 ? 0.55 : 0.25;
        if (Math.random() < smashBias && level >= 2) {
          this.aiInput.smashBuffer = 0.12;
          if (dy > 0.9) this.aiInput.up = true;
        } else {
          this.aiInput.lightBuffer = 0.12;
        }
      }
    } else if (dist > 4.5 && dist < 11 && Math.abs(dy) < 2.2 && Math.random() < 0.14 + level * 0.06) {
      // Projectile / dash poke at mid-range
      ai.facing = dx >= 0 ? 1 : -1;
      this.aiInput.specialBuffer = 0.12;
    }

    this.aiInput.left = ai.aiDesiredMove === -1;
    this.aiInput.right = ai.aiDesiredMove === 1;
  }

  // ==================== ANIMATION & CAMERA ====================

  private animateFighterRig(f: FighterRuntime, dt: number): void {
    const rig = f.rig;
    rig.root.position.set(f.x, f.y, 0);

    // Facing rotation smoothly damped
    const targetRotY = f.facing === 1 ? 0 : Math.PI;
    rig.bodyPivot.rotation.y = THREE.MathUtils.damp(rig.bodyPivot.rotation.y, targetRotY, 18, dt);

    // Squash & stretch
    const baseScale = f.profileId === 'titan' ? 1.18 : f.profileId === 'vespera' ? 0.95 : f.profileId === 'lyra' ? 0.98 : 1.02;
    rig.bodyPivot.scale.set(baseScale * f.squashX, baseScale * f.squashY, baseScale * f.squashX);

    // Invulnerability blink
    if (f.invulnTimer > 0) {
      rig.root.visible = Math.floor(f.invulnTimer * 18) % 2 === 0;
    } else if (f.action !== 'ko') {
      rig.root.visible = true;
    }

    // Hit flash emissive pulse
    const flashing = f.hitFlashTimer > 0;
    for (let i = 0; i < rig.hitFlashMaterials.length; i++) {
      const m = rig.hitFlashMaterials[i];
      if (flashing) {
        m.emissive.setHex(0xffffff);
        m.emissiveIntensity = 1.4;
      } else {
        m.emissive.copy(rig.baseEmissives[i]);
        m.emissiveIntensity = rig.baseEmissives[i].getHex() > 0 ? 1.5 : 0;
      }
    }

    // Shield visibility & scale
    if (f.action === 'shield') {
      rig.shieldMesh.visible = true;
      const s = 0.35 + (f.shield / 100) * 0.7;
      rig.shieldMesh.scale.setScalar(s);
    } else {
      rig.shieldMesh.visible = false;
    }

    // Slash arc visibility
    const showSlash =
      (f.action === 'light' || f.action === 'smash' || f.action === 'up_special') &&
      f.actionTimer > 0.04;
    rig.slashArc.visible = showSlash;
    if (showSlash) {
      rig.slashArc.position.x = f.facing * 0.65;
      rig.slashArc.rotation.y = f.facing === 1 ? 0 : Math.PI;
      rig.slashArc.rotation.z =
        f.action === 'up_special'
          ? Math.PI * 0.35
          : (f.actionDuration - f.actionTimer) * 14 - 0.8;
    }

    // Contact player ring only visible near ground
    rig.playerRing.visible = f.grounded;

    // Articulated limbs by action state
    const t = f.animTime;
    rig.torso.rotation.set(0, 0, 0);
    rig.leftLeg.rotation.set(0, 0, 0);
    rig.rightLeg.rotation.set(0, 0, 0);
    rig.leftArm.rotation.set(0, 0, 0);
    rig.rightArm.rotation.set(0, 0, 0);

    if (f.action === 'idle') {
      rig.torso.position.y = 0.75 + Math.sin(t * 4.5) * 0.04;
      rig.rightArm.rotation.z = 0.25 + Math.sin(t * 3.5) * 0.07;
      rig.leftArm.rotation.z = -0.25 - Math.sin(t * 3.5) * 0.07;
      rig.accentAccessory.rotation.z = Math.sin(t * 4) * 0.08;
    } else if (f.action === 'run') {
      const cycle = t * 14;
      rig.torso.position.y = 0.75 + Math.abs(Math.sin(cycle)) * 0.07;
      rig.torso.rotation.z = -0.24;
      rig.leftLeg.rotation.z = Math.sin(cycle) * 0.85;
      rig.rightLeg.rotation.z = -Math.sin(cycle) * 0.85;
      rig.leftArm.rotation.z = -Math.sin(cycle) * 0.65;
      rig.rightArm.rotation.z = Math.sin(cycle) * 0.65 - 0.3;
      rig.accentAccessory.rotation.z = -0.45 + Math.sin(cycle) * 0.15;
    } else if (f.action === 'jump' || f.action === 'fall') {
      rig.torso.rotation.z = f.vy > 0 ? 0.12 : -0.15;
      rig.leftLeg.rotation.z = 0.45;
      rig.rightLeg.rotation.z = -0.35;
      rig.leftArm.rotation.z = 0.65;
      rig.rightArm.rotation.z = -0.5;
    } else if (f.action === 'smash_charge') {
      rig.torso.rotation.z = 0.35;
      rig.rightArm.rotation.z = 2.1;
      rig.leftArm.rotation.z = -0.5;
    } else if (f.action === 'light' || f.action === 'smash') {
      const prog = 1 - f.actionTimer / Math.max(0.01, f.actionDuration);
      rig.torso.rotation.z = -0.32;
      rig.rightArm.rotation.z = 1.9 - prog * 3.1;
      rig.leftArm.rotation.z = -0.6;
    } else if (f.action === 'up_special') {
      rig.torso.rotation.y += t * 18;
      rig.rightArm.rotation.z = 2.6;
      rig.leftArm.rotation.z = 2.4;
    } else if (f.action === 'hitstun' || f.action === 'dizzy') {
      rig.torso.rotation.z = 0.55;
      rig.head.rotation.z = f.action === 'dizzy' ? Math.sin(t * 14) * 0.4 : 0.25;
      rig.leftArm.rotation.z = 1.1;
      rig.rightArm.rotation.z = 1.1;
    }
  }

  private updateCombatCamera(dt: number): void {
    const p1 = this.fighters[0];
    const p2 = this.fighters[1];
    if (!p1 || !p2) return;

    const bz = this.currentStage.blastZones;
    const x1 = THREE.MathUtils.clamp(p1.x, bz.left + 3, bz.right - 3);
    const y1 = THREE.MathUtils.clamp(p1.y, bz.bottom + 3, bz.top - 3);
    const x2 = THREE.MathUtils.clamp(p2.x, bz.left + 3, bz.right - 3);
    const y2 = THREE.MathUtils.clamp(p2.y, bz.bottom + 3, bz.top - 3);

    const midX = THREE.MathUtils.clamp((x1 + x2) * 0.5, -6.5, 6.5);
    const midY = THREE.MathUtils.clamp((y1 + y2) * 0.5 + 1.8, 1.5, 7.5);
    const spanX = Math.abs(x1 - x2);
    const spanY = Math.abs(y1 - y2);
    const desiredZ = THREE.MathUtils.clamp(14.5 + spanX * 0.65 + spanY * 0.55, 16.5, 29.5);

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, midX * 0.72, 5.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, midY + 2.2, 5.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, desiredZ, 5.0, dt);

    // Camera trauma shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraTrauma > 0) {
      const mag = this.cameraTrauma * this.cameraTrauma * 0.65;
      shakeX = (Math.random() * 2 - 1) * mag;
      shakeY = (Math.random() * 2 - 1) * mag;
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.4);
    }

    _targetLookAt.set(midX * 0.75 + shakeX, midY + shakeY, 0);
    _currentLookAt.lerp(_targetLookAt, 1 - Math.exp(-8 * dt));
    this.camera.lookAt(_currentLookAt);
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.vy -= 9.5 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, p.y, p.z);
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = t;
      p.mesh.scale.setScalar(p.scale * (0.4 + t * 0.7));
    }
  }

  private computeOffscreenIndicator(f: FighterRuntime): FighterHudState['offscreen'] {
    if (f.action === 'ko') {
      return { visible: false, xPct: 50, yPct: 50, angleRad: 0 };
    }
    _projVec.set(f.x, f.y + 1.0, 0).project(this.camera);
    const out =
      Math.abs(_projVec.x) > 0.96 || Math.abs(_projVec.y) > 0.92 || _projVec.z > 1;
    if (!out) {
      return { visible: false, xPct: 50, yPct: 50, angleRad: 0 };
    }
    const clampedX = THREE.MathUtils.clamp(_projVec.x, -0.9, 0.9);
    const clampedY = THREE.MathUtils.clamp(_projVec.y, -0.82, 0.82);
    const xPct = (clampedX * 0.5 + 0.5) * 100;
    const yPct = (-clampedY * 0.5 + 0.5) * 100;
    const angleRad = Math.atan2(-_projVec.y, _projVec.x);
    return { visible: true, xPct, yPct, angleRad };
  }

  private buildFighterHud(f: FighterRuntime): FighterHudState {
    return {
      id: f.profileId,
      name: FIGHTERS[f.profileId].name,
      isPlayer: f.isPlayer,
      damage: Math.round(f.damage),
      stocks: f.stocks,
      maxStocks: f.maxStocks,
      shield: Math.round(f.shield),
      isShielding: f.action === 'shield',
      action: f.action,
      lastHitTimestamp: f.lastHitTimestamp,
      offscreen: this.computeOffscreenIndicator(f),
    };
  }

  private emitHudSnapshot(): void {
    const p1 = this.fighters[0];
    const p2 = this.fighters[1];
    if (!p1 || !p2) return;

    this.callbacks.onHudUpdate({
      fighters: [this.buildFighterHud(p1), this.buildFighterHud(p2)],
      elapsedSec: this.matchElapsed,
      banner: this.banner,
      stats: { ...this.stats },
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);

    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    }

    this.clearProjectiles();
    this.clearFighters();
    this.clearShowcase();
    if (this.stageVisuals) {
      disposeObject3D(this.stageVisuals.root);
    }
    this.particles.forEach((p) => {
      p.mesh.material.dispose();
    });
    this.textures.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
