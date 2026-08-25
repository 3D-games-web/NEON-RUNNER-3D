<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Neon Runner 3D</title>
  <style>
    * 
    
  </style>
</head>
<body>
  <div id="hud">
    <strong>NEON RUNNER 3D</strong><br>
    Score: <span id="score">0</span>
    &nbsp; | &nbsp;
    Lives: <span id="lives">3</span><br>
    <small>A/D or ←/→ to move · W/↑/Space to jump</small>
  </div>

  <div id="message"></div>

  <script type="module">
    import * as THREE from "https://esm.sh/three@0.160.0";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b20);
    scene.fog = new THREE.Fog(0x080b20, 18, 55);

    const camera = new THREE.PerspectiveCamera(
      60,
      innerWidth / innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 4, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0x6d8cff, 0x17102f, 1.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(-8, 14, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const world = new THREE.Group();
    scene.add(world);

    const player = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.1, 0.8),
      new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x006677,
        roughness: 0.25
      })
    );
    player.position.set(-12, 1.05, 0);
    player.castShadow = true;
    world.add(player);

    const platforms = [];
    const coins = [];
    const enemies = [];

    function createPlatform(x, y, width, color = 0x263b75) {
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.6, 3),
        new THREE.MeshStandardMaterial({
          color,
          emissive: 0x101b45,
          roughness: 0.75
        })
      );
      platform.position.set(x, y, 0);
      platform.receiveShadow = true;
      world.add(platform);
      platforms.push({
        mesh: platform,
        left: x - width / 2,
        right: x + width / 2,
        top: y + 0.3
      });
    }

    function createCoin(x, y) {
      const coin = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.09, 12, 24),
        new THREE.MeshStandardMaterial({
          color: 0xffdf35,
          emissive: 0xaa6500,
          metalness: 0.8,
          roughness: 0.2
        })
      );
      coin.position.set(x, y, 0);
      coin.rotation.y = Math.PI / 2;
      coin.castShadow = true;
      world.add(coin);
      coins.push(coin);
    }

    function createEnemy(x, y, left, right) {
      const enemy = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 20, 20),
        new THREE.MeshStandardMaterial({
          color: 0xff287f,
          emissive: 0x71002d,
          roughness: 0.3
        })
      );
      enemy.position.set(x, y, 0);
      enemy.castShadow = true;
      world.add(enemy);
      enemies.push({ mesh: enemy, left, right, direction: 1 });
    }

    // Ground and raised platforms
    createPlatform(0, 0, 14, 0x263b75);
    createPlatform(10, 1.5, 5, 0x31528c);
    createPlatform(17, 0, 8, 0x263b75);
    createPlatform(24, 2, 5, 0x31528c);
    createPlatform(31, 0, 10, 0x263b75);

    // Decorative stars
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0x7de8ff });
    for (let i = 0; i < 70; i++) {
      const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 6),
        starMaterial
      );
      star.position.set(
        -15 + Math.random() * 52,
        5 + Math.random() * 9,
        -3 - Math.random() * 4
      );
      scene.add(star);
    }

    [-9, -5, -1, 8.5, 11, 16, 20, 26, 29, 34].forEach((x, i) => {
      createCoin(x, i % 3 === 0 ? 2.1 : 1.5);
    });

    createEnemy(4, 1.05, 2, 6);
    createEnemy(18, 1.05, 15, 20);
    createEnemy(30, 1.05, 27, 34);

    // Finish flag
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    flagPole.position.set(35, 1.8, 0);
    flagPole.castShadow = true;
    world.add(flagPole);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.8),
      new THREE.MeshBasicMaterial({ color: 0xffdf35, side: THREE.DoubleSide })
    );
    flag.position.set(35.65, 2.65, 0);
    world.add(flag);

    const keys = {};
    let verticalVelocity = 0;
    let score = 0;
    let lives = 3;
    let gameOver = false;
    let won = false;

    const scoreElement = document.querySelector("#score");
    const livesElement = document.querySelector("#lives");
    const message = document.querySelector("#message");

    addEventListener("keydown", (event) => {
      keys[event.key.toLowerCase()] = true;

      if (
        ["arrowup", "w", " "].includes(event.key.toLowerCase()) &&
        isOnGround()
      ) {
        verticalVelocity = 8;
      }

      if (gameOver || won) {
        resetGame();
      }
    });

    addEventListener("keyup", (event) => {
      keys[event.key.toLowerCase()] = false;
    });

    function isOnGround() {
      return player.position.y <= 1.06;
    }

    function resetGame() {
      player.position.set(-12, 1.05, 0);
      verticalVelocity = 0;
      score = 0;
      lives = 3;
      gameOver = false;
      won = false;
      message.innerHTML = "";
      coins.forEach((coin) => {
        coin.visible = true;
        coin.userData.collected = false;
      });
      updateHud();
    }

    function loseLife() {
      lives--;
      updateHud();

      if (lives <= 0) {
        gameOver = true;
        message.innerHTML = "GAME OVER<small>Press any key to restart</small>";
      } else {
        player.position.set(-12, 1.05, 0);
        verticalVelocity = 0;
      }
    }

    function updateHud() {
      scoreElement.textContent = score;
      livesElement.textContent = lives;
    }

    function updatePlayer(delta) {
      const movingLeft = keys.arrowleft || keys.a;
      const movingRight = keys.arrowright || keys.d;
      const speed = 7 * delta;

      if (movingLeft) player.position.x -= speed;
      if (movingRight) player.position.x += speed;

      player.position.x = THREE.MathUtils.clamp(player.position.x, -13, 36);

      verticalVelocity -= 22 * delta;
      player.position.y += verticalVelocity * delta;

      let landed = false;

      for (const platform of platforms) {
        const insideX =
          player.position.x > platform.left - 0.35 &&
          player.position.x < platform.right + 0.35;

        const fallingToPlatform =
          verticalVelocity <= 0 &&
          player.position.y <= platform.top + 0.76 &&
          player.position.y >= platform.top - 0.25;

        if (insideX && fallingToPlatform) {
          player.position.y = platform.top + 0.76;
          verticalVelocity = 0;
          landed = true;
          break;
        }
      }

      if (!landed && player.position.y < -3) loseLife();

      player.rotation.z -= delta * 5;
    }

    function updateCoins(delta) {
      for (const coin of coins) {
        if (!coin.visible) continue;

        coin.rotation.x += delta * 4;
        coin.rotation.y += delta * 5;

        if (coin.position.distanceTo(player.position) < 0.85) {
          coin.visible = false;
          score += 10;
          updateHud();
        }
      }
    }

    function updateEnemies(delta) {
      for (const enemy of enemies) {
        const data = enemy;
        data.mesh.position.x += data.direction * delta * 2.2;

        if (data.mesh.position.x > data.right || data.mesh.position.x < data.left) {
          data.direction *= -1;
        }

        data.mesh.rotation.y += delta * 4;

        if (data.mesh.position.distanceTo(player.position) < 1.05) {
          loseLife();
          return;
        }
      }
    }

    function animate(time) {
      requestAnimationFrame(animate);

      if (!gameOver && !won) {
        const delta = Math.min((time - (animate.lastTime || time)) / 1000, 0.05);
        animate.lastTime = time;

        updatePlayer(delta);
        updateCoins(delta);
        updateEnemies(delta);

        if (player.position.x >= 34.5) {
          won = true;
          score += 100;
          updateHud();
          message.innerHTML = "YOU WIN!<small>Press any key to play again</small>";
        }
      }

      const targetCameraX = player.position.x + 2;
      camera.position.x += (targetCameraX - camera.position.x) * 0.08;
      camera.lookAt(camera.position.x, 2.2, 0);

      renderer.render(scene, camera);
    }

    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    updateHud();
    animate(0);
  </script>
</body>
</html>