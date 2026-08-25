"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type PlatformData = { left: number; right: number; top: number };
type EnemyData = { mesh: THREE.Mesh; left: number; right: number; direction: number; start: number };
type GameStatus = "playing" | "game-over" | "won";

export default function Home() {
  const gameRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState<GameStatus>("playing");

  useEffect(() => {
    if (!gameRef.current) return;
    const container = gameRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b20);
    scene.fog = new THREE.Fog(0x080b20, 18, 55);

    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 4, 11);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x6d8cff, 0x17102f, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(-8, 14, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const world = new THREE.Group();
    scene.add(world);
    const platforms: PlatformData[] = [];
    const coins: THREE.Mesh[] = [];
    const enemies: EnemyData[] = [];
    const player = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.1, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x006677, roughness: 0.25 }),
    );
    player.position.set(-12, 1.05, 0);
    player.castShadow = true;
    world.add(player);

    function createPlatform(x: number, y: number, width: number, color = 0x263b75) {
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.6, 3),
        new THREE.MeshStandardMaterial({ color, emissive: 0x101b45, roughness: 0.75 }),
      );
      platform.position.set(x, y, 0);
      platform.receiveShadow = true;
      world.add(platform);
      platforms.push({ left: x - width / 2, right: x + width / 2, top: y + 0.3 });
    }

    function createCoin(x: number, y: number) {
      const coin = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.09, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0xffdf35, emissive: 0xaa6500, metalness: 0.8, roughness: 0.2 }),
      );
      coin.position.set(x, y, 0);
      coin.rotation.y = Math.PI / 2;
      coin.castShadow = true;
      world.add(coin);
      coins.push(coin);
    }

    function createEnemy(x: number, y: number, left: number, right: number) {
      const enemy = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xff287f, emissive: 0x71002d, roughness: 0.3 }),
      );
      enemy.position.set(x, y, 0);
      enemy.castShadow = true;
      world.add(enemy);
      enemies.push({ mesh: enemy, left, right, direction: 1, start: x });
    }

    createPlatform(0, 0, 14);
    createPlatform(10, 1.5, 5, 0x31528c);
    createPlatform(17, 0, 8);
    createPlatform(24, 2, 5, 0x31528c);
    createPlatform(31, 0, 10);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0x7de8ff });
    for (let index = 0; index < 70; index += 1) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), starMaterial);
      star.position.set(-15 + Math.random() * 52, 5 + Math.random() * 9, -3 - Math.random() * 4);
      scene.add(star);
    }
    [-9, -5, -1, 8.5, 11, 16, 20, 26, 29, 34].forEach((x, index) => createCoin(x, index % 3 === 0 ? 2.1 : 1.5));
    createEnemy(4, 1.05, 2, 6);
    createEnemy(18, 1.05, 15, 20);
    createEnemy(30, 1.05, 27, 34);

    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    flagPole.position.set(35, 1.8, 0);
    flagPole.castShadow = true;
    world.add(flagPole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshBasicMaterial({ color: 0xffdf35, side: THREE.DoubleSide }));
    flag.position.set(35.65, 2.65, 0);
    world.add(flag);

    const keys: Record<string, boolean> = {};
    let verticalVelocity = 0;
    let currentScore = 0;
    let currentLives = 3;
    let gameState: GameStatus = "playing";
    const isOnGround = () => player.position.y <= 1.06;
    const resetGame = () => {
      player.position.set(-12, 1.05, 0);
      verticalVelocity = 0;
      currentScore = 0;
      currentLives = 3;
      gameState = "playing";
      coins.forEach((coin) => { coin.visible = true; });
      enemies.forEach((enemy) => { enemy.mesh.position.x = enemy.start; enemy.direction = 1; });
      setScore(0);
      setLives(3);
      setStatus("playing");
    };
    const loseLife = () => {
      currentLives -= 1;
      setLives(currentLives);
      if (currentLives <= 0) {
        gameState = "game-over";
        setStatus("game-over");
      } else {
        player.position.set(-12, 1.05, 0);
        verticalVelocity = 0;
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keys[key] = true;
      if (["arrowup", "w", " "].includes(key) && isOnGround() && gameState === "playing") verticalVelocity = 8;
      if (gameState !== "playing") resetGame();
    };
    const handleKeyUp = (event: KeyboardEvent) => { keys[event.key.toLowerCase()] = false; };
    const handleResize = () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };
    addEventListener("keydown", handleKeyDown);
    addEventListener("keyup", handleKeyUp);
    addEventListener("resize", handleResize);

    let frameId = 0;
    let lastTime = 0;
    const animate = (time: number) => {
      frameId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      if (gameState === "playing") {
        if (keys.arrowleft || keys.a) player.position.x -= 7 * delta;
        if (keys.arrowright || keys.d) player.position.x += 7 * delta;
        player.position.x = THREE.MathUtils.clamp(player.position.x, -13, 36);
        verticalVelocity -= 22 * delta;
        player.position.y += verticalVelocity * delta;
        let landed = false;
        for (const platform of platforms) {
          const insideX = player.position.x > platform.left - 0.35 && player.position.x < platform.right + 0.35;
          const fallingToPlatform = verticalVelocity <= 0 && player.position.y <= platform.top + 0.76 && player.position.y >= platform.top - 0.25;
          if (insideX && fallingToPlatform) {
            player.position.y = platform.top + 0.76;
            verticalVelocity = 0;
            landed = true;
            break;
          }
        }
        if (!landed && player.position.y < -3) loseLife();
        player.rotation.z -= delta * 5;
        coins.forEach((coin) => {
          if (!coin.visible) return;
          coin.rotation.x += delta * 4;
          coin.rotation.y += delta * 5;
          if (coin.position.distanceTo(player.position) < 0.85) {
            coin.visible = false;
            currentScore += 10;
            setScore(currentScore);
          }
        });
        for (const enemy of enemies) {
          enemy.mesh.position.x += enemy.direction * delta * 2.2;
          if (enemy.mesh.position.x > enemy.right || enemy.mesh.position.x < enemy.left) enemy.direction *= -1;
          enemy.mesh.rotation.y += delta * 4;
          if (enemy.mesh.position.distanceTo(player.position) < 1.05) {
            loseLife();
            break;
          }
        }
        if (player.position.x >= 34.5) {
          gameState = "won";
          currentScore += 100;
          setScore(currentScore);
          setStatus("won");
        }
      }
      camera.position.x += (player.position.x + 2 - camera.position.x) * 0.08;
      camera.lookAt(camera.position.x, 2.2, 0);
      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      removeEventListener("keydown", handleKeyDown);
      removeEventListener("keyup", handleKeyUp);
      removeEventListener("resize", handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <main className="game-shell">
      <div ref={gameRef} className="game-canvas" />
      <section className="hud" aria-label="Game status">
        <p className="eyebrow">Neon Runner <span>3D</span></p>
        <div className="hud-stats"><span>Score <strong>{score}</strong></span><span>Lives <strong>{lives}</strong></span></div>
        <p className="controls">A / D or arrow keys to move<br />W / up arrow / space to jump</p>
      </section>
      {status !== "playing" && (
        <button className="message" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }))}>
          <strong>{status === "won" ? "You win" : "Game over"}</strong>
          <span>Press any key to play again</span>
        </button>
      )}
    </main>
  );
}