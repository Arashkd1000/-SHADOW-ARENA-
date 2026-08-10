const Game = {

  scene: null,
  camera: null,
  renderer: null,
  clock: null,

  gun: null,

  enemies: [],

  keys: {},

  yaw: 0,
  pitch: 0,

  velocityY: 0,
  grounded: true,

  health: 100,

  ammo: 30,
  reserve: 120,

  score: 0,
  wave: 1,

  playing: false,

  locked: false,

  lastShot: 0,

  shotDelay: 120,

  recoil: 0,

  enemySpawnTimer: 0

};


/* =====================================================
   ELEMENTS
===================================================== */

const $ = id =>
  document.getElementById(id);

const menu =
  $("menu");

const hud =
  $("hud");

const loading =
  $("loading");

const gameOver =
  $("gameOver");

const notification =
  $("notification");


/* =====================================================
   INIT
===================================================== */

function init() {

  Game.scene =
    new THREE.Scene();

  Game.scene.background =
    new THREE.Color(0x070c15);

  Game.scene.fog =
    new THREE.Fog(
      0x070c15,
      25,
      130
    );


  Game.camera =
    new THREE.PerspectiveCamera(
      75,
      innerWidth / innerHeight,
      .05,
      300
    );

  Game.camera.position.set(
    0,
    1.7,
    8
  );


  Game.renderer =
    new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });

  Game.renderer.setSize(
    innerWidth,
    innerHeight
  );

  Game.renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      2
    )
  );

  Game.renderer.shadowMap.enabled = true;

  Game.renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  document.body.appendChild(
    Game.renderer.domElement
  );


  Game.clock =
    new THREE.Clock();


  createLighting();

  createWorld();

  createGun();

  spawnWave();

  setupControls();

  updateHUD();

  loading.style.display =
    "none";

}


/* =====================================================
   LIGHTING
===================================================== */

function createLighting() {

  const hemi =
    new THREE.HemisphereLight(
      0x9bb8ff,
      0x080b12,
      1.4
    );

  Game.scene.add(hemi);


  const sun =
    new THREE.DirectionalLight(
      0xffffff,
      2.2
    );

  sun.position.set(
    30,
    45,
    20
  );

  sun.castShadow = true;

  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;

  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;

  Game.scene.add(sun);


  const blue =
    new THREE.PointLight(
      0x397bff,
      20,
      45
    );

  blue.position.set(
    0,
    7,
    -15
  );

  Game.scene.add(blue);

}


/* =====================================================
   WORLD
===================================================== */

function createWorld() {

  const floorMat =
    new THREE.MeshStandardMaterial({
      color: 0x252d3b,
      roughness: .88,
      metalness: .08
    });


  const floor =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        180,
        180
      ),
      floorMat
    );

  floor.rotation.x =
    -Math.PI / 2;

  floor.receiveShadow = true;

  Game.scene.add(floor);


  // Grid

  const grid =
    new THREE.GridHelper(
      180,
      90,
      0x40506c,
      0x1b2639
    );

  grid.position.y =
    .012;

  Game.scene.add(grid);


  // Buildings / obstacles

  for(let i=0;i<30;i++) {

    const width =
      3 + Math.random()*7;

    const height =
      2 + Math.random()*8;

    const depth =
      3 + Math.random()*7;


    const mat =
      new THREE.MeshStandardMaterial({
        color:
          new THREE.Color(
            .12 + Math.random()*.08,
            .15 + Math.random()*.08,
            .21 + Math.random()*.1
          )
      });


    const obj =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width,
          height,
          depth
        ),
        mat
      );


    obj.position.set(
      (Math.random()-.5)*100,
      height/2,
      (Math.random()-.5)*100
    );


    obj.rotation.y =
      Math.random()*Math.PI;


    obj.castShadow = true;

    obj.receiveShadow = true;


    Game.scene.add(obj);

  }

}


/* =====================================================
   GUN
===================================================== */

function createGun() {

  Game.gun =
    new THREE.Group();


  const metal =
    new THREE.MeshStandardMaterial({
      color: 0x11151c,
      metalness: .9,
      roughness: .22
    });


  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .34,
        .2,
        .85
      ),
      metal
    );

  body.position.set(
    .36,
    -.27,
    -.72
  );


  const barrel =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        .045,
        .06,
        .6,
        20
      ),
      metal
    );

  barrel.rotation.x =
    Math.PI/2;

  barrel.position.set(
    .36,
    -.26,
    -1.22
  );


  const grip =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .13,
        .4,
        .18
      ),
      new THREE.MeshStandardMaterial({
        color: 0x171717
      })
    );

  grip.rotation.x =
    -.25;

  grip.position.set(
    .36,
    -.49,
    -.52
  );


  Game.gun.add(
    body,
    barrel,
    grip
  );


  Game.camera.add(
    Game.gun
  );

  Game.scene.add(
    Game.camera
  );

}


/* =====================================================
   ENEMY
===================================================== */

function createEnemy() {

  const enemy =
    new THREE.Group();


  const bodyMat =
    new THREE.MeshStandardMaterial({
      color: 0xa51e32,
      roughness: .7
    });


  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        .9,
        1.55,
        .65
      ),
      bodyMat
    );

  body.position.y =
    .78;


  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .36,
        20,
        20
      ),
      new THREE.MeshStandardMaterial({
        color: 0xc98f76
      })
    );

  head.position.y =
    1.82;


  const eyeMat =
    new THREE.MeshBasicMaterial({
      color: 0xff2222
    });


  const eye1 =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .045,
        8,
        8
      ),
      eyeMat
    );

  eye1.position.set(
    -.13,
    1.87,
    -.33
  );


  const eye2 =
    eye1.clone();

  eye2.position.x =
    .13;


  enemy.add(
    body,
    head,
    eye1,
    eye2
  );


  enemy.userData = {

    hp: 100,

    speed:
      .9 + Math.random()*.7,

    attack: 0,

    hitFlash: 0

  };


  enemy.traverse(
    object => {

      if(object.isMesh)
        object.castShadow = true;

    }
  );


  return enemy;

}


/* =====================================================
   SPAWN WAVE
===================================================== */

function spawnWave() {

  const count =
    4 + Game.wave * 2;


  for(let i=0;i<count;i++) {

    const enemy =
      createEnemy();


    const angle =
      Math.random()*Math.PI*2;


    const distance =
      25 + Math.random()*35;


    enemy.position.set(

      Game.camera.position.x +
      Math.cos(angle)*distance,

      0,

      Game.camera.position.z +
      Math.sin(angle)*distance

    );


    Game.scene.add(
      enemy
    );

    Game.enemies.push(
      enemy
    );

  }


  notification.textContent =
    "WAVE " + Game.wave;


  setTimeout(
    () => notification.textContent = "",
    1500
  );

}


/* =====================================================
   CONTROLS
===================================================== */

function setupControls() {

  document.addEventListener(
    "keydown",
    e => {

      Game.keys[e.code] =
        true;


      if(e.code === "Space")
        jump();


      if(e.code === "KeyR")
        reload();

    }
  );


  document.addEventListener(
    "keyup",
    e => {

      Game.keys[e.code] =
        false;

    }
  );


  Game.renderer.domElement
    .addEventListener(
      "click",
      () => {

        if(innerWidth > 800)
          Game.renderer.domElement
            .requestPointerLock();

      }
    );


  document.addEventListener(
    "pointerlockchange",
    () => {

      Game.locked =
        document.pointerLockElement ===
        Game.renderer.domElement;

    }
  );


  document.addEventListener(
    "mousemove",
    e => {

      if(!Game.locked)
        return;


      Game.yaw -=
        e.movementX * .0022;

      Game.pitch -=
        e.movementY * .0022;


      Game.pitch =
        Math.max(
          -1.4,
          Math.min(
            1.4,
            Game.pitch
          )
        );

    }
  );


  document.addEventListener(
    "mousedown",
    e => {

      if(e.button === 0)
        shoot();

    }
  );


  // Mobile

  document
    .querySelectorAll(
      "#joystick button"
    )
    .forEach(button => {

      const key =
        button.dataset.key;


      button.addEventListener(
        "touchstart",
        e => {

          e.preventDefault();

          Game.keys[key] = true;

        }
      );


      button.addEventListener(
        "touchend",
        e => {

          e.preventDefault();

          Game.keys[key] = false;

        }
      );

    });


  $("mobileFire")
    .addEventListener(
      "touchstart",
      e => {

        e.preventDefault();

        shoot();

      }
    );


  $("mobileReload")
    .addEventListener(
      "touchstart",
      e => {

        e.preventDefault();

        reload();

      }
    );


  $("mobileJump")
    .addEventListener(
      "touchstart",
      e => {

        e.preventDefault();

        jump();

      }
    );

}


/* =====================================================
   PLAYER MOVEMENT
===================================================== */

function updatePlayer(dt) {

  const direction =
    new THREE.Vector3();


  if(Game.keys.KeyW)
    direction.z -= 1;

  if(Game.keys.KeyS)
    direction.z += 1;

  if(Game.keys.KeyA)
    direction.x -= 1;

  if(Game.keys.KeyD)
    direction.x += 1;


  if(direction.lengthSq()) {

    direction.normalize();


    direction.applyAxisAngle(
      new THREE.Vector3(
        0,
        1,
        0
      ),
      Game.yaw
    );


    const sprint =
      Game.keys.ShiftLeft ||
      Game.keys.ShiftRight
        ? 1.7
        : 1;


    Game.camera.position
      .addScaledVector(
        direction,
        dt * 6 * sprint
      );

  }


  Game.velocityY -=
    20 * dt;


  Game.camera.position.y +=
    Game.velocityY * dt;


  if(
    Game.camera.position.y <= 1.7
  ) {

    Game.camera.position.y =
      1.7;

    Game.velocityY = 0;

    Game.grounded = true;

  }


  // Camera rotation

  Game.camera.rotation.order =
    "YXZ";

  Game.camera.rotation.y =
    Game.yaw;

  Game.camera.rotation.x =
    Game.pitch;

}


/* =====================================================
   JUMP
===================================================== */

function jump() {

  if(!Game.grounded)
    return;


  Game.velocityY =
    8;

  Game.grounded =
    false;

}


/* =====================================================
   SHOOT
===================================================== */

function shoot() {

  if(!Game.playing)
    return;


  const now =
    performance.now();


  if(
    now - Game.lastShot <
    Game.shotDelay
  )
    return;


  Game.lastShot =
    now;


  if(Game.ammo <= 0) {

    reload();

    return;

  }


  Game.ammo--;

  Game.recoil =
    .08;


  updateHUD();


  // Flash

  const flash =
    new THREE.PointLight(
      0xffb347,
      12,
           4
    );


  flash.position.set(
    .36,
    -.25,
    -1.35
  );


  Game.camera.add(
    flash
  );


  setTimeout(
    () =>
      Game.camera.remove(
        flash
      ),
    45
  );


  // Raycast

  const ray =
    new THREE.Raycaster();


  ray.setFromCamera(
    new THREE.Vector2(
      0,
      0
    ),
    Game.camera
  );


  const objects = [];


  Game.enemies.forEach(
    enemy => {

      enemy.traverse(
        object => {

          if(object.isMesh)
            objects.push(object);

        }
      );

    }
  );


  const hits =
    ray.intersectObjects(
      objects,
      true
    );


  if(!hits.length)
    return;


  let enemy =
    hits[0].object;


  while(
    enemy &&
    !Game.enemies.includes(enemy)
  ) {

    enemy =
      enemy.parent;

  }


  if(!enemy)
    return;


  enemy.userData.hp -=
    50;


  showHitmarker();


  if(
    enemy.userData.hp <= 0
  ) {

    killEnemy(enemy);

  }

}


/* =====================================================
   KILL
===================================================== */

function killEnemy(enemy) {

  Game.scene.remove(
    enemy
  );


  Game.enemies =
    Game.enemies.filter(
      e => e !== enemy
    );


  Game.score +=
    100;


  updateHUD();


  if(Game.enemies.length === 0) {

    Game.wave++;

    setTimeout(
      spawnWave,
      1200
    );

  }

}


/* =====================================================
   HITMARKER
===================================================== */

function showHitmarker() {

  const marker =
    $("hitmarker");


  marker.style.opacity =
    "1";


  setTimeout(
    () =>
      marker.style.opacity = "0",
    90
  );

}


/* =====================================================
   RELOAD
===================================================== */

function reload() {

  if(
    Game.ammo >= 30 ||
    Game.reserve <= 0
  )
    return;


  const amount =
    Math.min(
      30 - Game.ammo,
      Game.reserve
    );


  Game.ammo +=
    amount;

  Game.reserve -=
    amount;


  updateHUD();

}


/* =====================================================
   ENEMY AI
===================================================== */

function updateEnemies(dt) {

  for(
    const enemy of Game.enemies
  ) {

    const distance =
      enemy.position.distanceTo(
        Game.camera.position
      );


    if(distance > 60)
      continue;


    const direction =
      new THREE.Vector3()
        .subVectors(
          Game.camera.position,
          enemy.position
        );


    direction.y = 0;


    if(direction.lengthSq())
      direction.normalize();


    enemy.position
      .addScaledVector(
        direction,
        enemy.userData.speed * dt
      );


    enemy.lookAt(
      Game.camera.position.x,
      enemy.position.y,
      Game.camera.position.z
    );


    enemy.userData.attack -=
      dt;


    if(
      distance < 2 &&
      enemy.userData.attack <= 0
    ) {

      enemy.userData.attack =
        1;


      Game.health -=
        10;


      showDamage();

      updateHUD();


      if(Game.health <= 0) {

        endGame();

        return;

      }

    }

  }

}


/* =====================================================
   DAMAGE
===================================================== */

function showDamage() {

  const damage =
    $("damage");


  damage.style.borderWidth =
    "20px";


  setTimeout(
    () =>
      damage.style.borderWidth =
        "0",
    180
  );

}


/* =====================================================
   HUD
===================================================== */

function updateHUD() {

  $("health").textContent =
    Math.max(
      0,
      Math.floor(Game.health)
    );


  $("ammo").textContent =
    Game.ammo;


  $("reserve").textContent =
    Game.reserve;


  $("score").textContent =
    Game.score;


  $("wave").textContent =
    Game.wave;

}


/* =====================================================
   GAME LOOP
===================================================== */

function animate() {

  requestAnimationFrame(
    animate
  );


  if(!Game.playing)
    return;


  const dt =
    Math.min(
      Game.clock.getDelta(),
      .05
    );


  updatePlayer(dt);

  updateEnemies(dt);


  // Weapon recoil

  Game.recoil *=
    Math.pow(
      .02,
      dt
    );


  Game.gun.position.z =
    -Game.recoil;


  // Weapon movement

  const moving =
    Game.keys.KeyW ||
    Game.keys.KeyA ||
    Game.keys.KeyS ||
    Game.keys.KeyD;


  if(moving) {

    const t =
      performance.now() *
      .012;


    Game.gun.position.y =
      Math.sin(t) *
      .012;


    Game.gun.rotation.z =
      Math.sin(t*.7) *
      .008;

  }


  Game.renderer.render(
    Game.scene,
    Game.camera
  );

}


/* =====================================================
   END GAME
===================================================== */

function endGame() {

  Game.playing =
    false;


  $("finalScore")
    .textContent =
    Game.score;


  gameOver.style.display =
    "flex";


  if(
    document.pointerLockElement
  ) {

    document.exitPointerLock();

  }

}


/* =====================================================
   START
===================================================== */

$("startBtn")
  .addEventListener(
    "click",
    () => {

      init();

      menu.style.display =
        "none";

      hud.style.display =
        "block";

      Game.playing =
        true;

      Game.clock.start();

      if(innerWidth > 800) {

        Game.renderer.domElement
          .requestPointerLock();

      }

      animate();

    }
  );


/* =====================================================
   RESTART
===================================================== */

$("restartBtn")
  .addEventListener(
    "click",
    () => {

      location.reload();

    }
  );


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener(
  "resize",
  () => {

    if(!Game.camera)
      return;


    Game.camera.aspect =
      innerWidth /
      innerHeight;


    Game.camera.updateProjectionMatrix();


    Game.renderer.setSize(
      innerWidth,
      innerHeight
    );

  }
);
