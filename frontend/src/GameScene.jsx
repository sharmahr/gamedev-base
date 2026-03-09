import { useEffect, useRef, useCallback } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  MeshBuilder,
  Vector3,
  Color3,
  StandardMaterial,
  ActionManager,
  ExecuteCodeAction,
  Animation,
  ParticleSystem,
  Texture,
  Color4,
} from "@babylonjs/core";

const SPHERE_COUNT = 5;
const ARENA_RADIUS = 8;

/**
 * Creates a glowing collectible sphere at a random position within the arena.
 *
 * Returns the created mesh so it can be tracked externally.
 */
function spawnSphere(scene, index) {
  const sphere = MeshBuilder.CreateSphere(
    `collectible_${index}_${Date.now()}`,
    { diameter: 0.8, segments: 16 },
    scene
  );

  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * ARENA_RADIUS * 0.8;
  sphere.position = new Vector3(
    Math.cos(angle) * radius,
    0.5 + Math.random() * 2,
    Math.sin(angle) * radius
  );

  const mat = new StandardMaterial(`mat_${index}_${Date.now()}`, scene);
  const hue = Math.random();
  mat.diffuseColor = Color3.FromHSV(hue * 360, 0.8, 1.0);
  mat.emissiveColor = Color3.FromHSV(hue * 360, 0.6, 0.5);
  mat.specularColor = new Color3(1, 1, 1);
  sphere.material = mat;

  const bobAnim = new Animation(
    "bob",
    "position.y",
    30,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CYCLE
  );
  const keys = [
    { frame: 0, value: sphere.position.y },
    { frame: 30, value: sphere.position.y + 0.4 },
    { frame: 60, value: sphere.position.y },
  ];
  bobAnim.setKeys(keys);
  sphere.animations.push(bobAnim);
  scene.beginAnimation(sphere, 0, 60, true);

  return sphere;
}

/**
 * Triggers a short particle burst at the given position to provide
 * visual feedback when a sphere is collected.
 */
function burstParticles(scene, position) {
  const ps = new ParticleSystem("burst", 50, scene);
  ps.createPointEmitter(new Vector3(-1, 1, -1), new Vector3(1, 1, 1));
  ps.emitter = position.clone();
  ps.minLifeTime = 0.2;
  ps.maxLifeTime = 0.5;
  ps.minSize = 0.05;
  ps.maxSize = 0.15;
  ps.emitRate = 200;
  ps.color1 = new Color4(1, 0.8, 0.2, 1);
  ps.color2 = new Color4(1, 0.2, 0.4, 1);
  ps.gravity = new Vector3(0, -5, 0);
  ps.targetStopDuration = 0.15;
  ps.disposeOnStop = true;
  ps.start();
}

/**
 * 3D game scene component.
 *
 * Renders a Babylon.js scene with a ground plane and collectible spheres.
 * Clicking a sphere awards a point and respawns it at a new location.
 */
export default function GameScene({ onScore }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const spheresRef = useRef([]);
  const onScoreRef = useRef(onScore);

  useEffect(() => {
    onScoreRef.current = onScore;
  }, [onScore]);

  const setupScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color4(0.06, 0.06, 0.12, 1);

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3,
      18,
      Vector3.Zero(),
      scene
    );
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 30;
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;
    light.groundColor = new Color3(0.1, 0.1, 0.2);

    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: ARENA_RADIUS * 2.5, height: ARENA_RADIUS * 2.5 },
      scene
    );
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.12, 0.15, 0.25);
    groundMat.specularColor = new Color3(0.05, 0.05, 0.1);
    ground.material = groundMat;

    const spheres = [];
    for (let i = 0; i < SPHERE_COUNT; i++) {
      const s = spawnSphere(scene, i);
      s.actionManager = new ActionManager(scene);
      s.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          burstParticles(scene, s.position);
          s.dispose();
          const idx = spheres.indexOf(s);
          if (idx !== -1) {
            const ns = spawnSphere(scene, i);
            ns.actionManager = new ActionManager(scene);
            ns.actionManager.registerAction(
              new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                handleClick(ns, spheres, scene, i);
              })
            );
            spheres[idx] = ns;
          }
          onScoreRef.current(1);
        })
      );
      spheres.push(s);
    }
    spheresRef.current = spheres;

    /**
     * Recursive click handler so newly spawned spheres remain interactive.
     */
    function handleClick(mesh, arr, sc, index) {
      burstParticles(sc, mesh.position);
      mesh.dispose();
      const idx = arr.indexOf(mesh);
      if (idx !== -1) {
        const ns = spawnSphere(sc, index);
        ns.actionManager = new ActionManager(sc);
        ns.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            handleClick(ns, arr, sc, index);
          })
        );
        arr[idx] = ns;
      }
      onScoreRef.current(1);
    }

    engine.runRenderLoop(() => scene.render());

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const cleanup = setupScene();
    return cleanup;
  }, [setupScene]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}
