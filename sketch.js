// ============================================================
//  UBIE AUDIO GAME  —  Total Revamp
//  Control Ubie with your VOICE! Volume = movement.
//  Collect all the orbs to level up. How far can you go?
// ============================================================

// --- Audio ---
let mic;
let vol = 0;
let smoothVol = 0;
let volSensitivity = 10;

// --- Game State ---
const STATE_TITLE = 0;
const STATE_PLAYING = 1;
const STATE_LEVELUP = 2;
const STATE_ANGEL = 3;
let gameState = STATE_TITLE;
let stateTimer = 0;

// --- Character ---
let ubie, ubieR = [], ubieJ = [], ubieRo = [];
let indexRun = 0, indexJump = 0, indexRoll = 0;
let animTimer = 0;
const ANIM_SPEED = 4; // frames between sprite changes

let playerX, playerY;
let playerVX = 0, playerVY = 0;
let imgW, imgH;
const RATIO = 1.3;
let groundY;
let playerAction = "still"; // still, run, roll, jump
let facingRight = true;
let gravity;
let isGrounded = true;

// --- Orbs ---
let orbs = [];
let orbCount = 3;
let orbPulse = 0;

// --- Scoring ---
let score = 0;
let level = 1;
let combo = 0;
let comboTimer = 0;
let lastCollectTime = 0;
let highScore = 0;

// --- Particles ---
let particles = [];

// --- Background ---
let ships = [];
let stars = [];
let mountains = [];
let grassBlades = [];

// --- Screen Shake ---
let shakeAmount = 0;
let shakeDuration = 0;

// --- Volume Meter ---
let volHistory = [];
const VOL_HISTORY_LEN = 40;

// --- Font ---
let words;

// --- UI ---
let titleBounce = 0;

// ============================================================
//  PRELOAD
// ============================================================
function preload() {
  ubie = loadImage("Ubie.png");
  words = loadFont("font.ttf");

  for (let i = 1; i <= 7; i++) {
    ubieR.push(loadImage("Run/Ubie_Run" + i + ".png"));
  }
  for (let i = 0; i < 2; i++) {
    ubieJ.push(loadImage("Jump/" + i + ".png"));
  }
  for (let i = 1; i <= 14; i++) {
    ubieRo.push(loadImage("Roll/Ubie_Flip" + i + ".png"));
  }
}

// ============================================================
//  SETUP
// ============================================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  imageMode(CENTER);
  textFont(words);
  getAudioContext().suspend();

  mic = new p5.AudioIn();
  mic.start();

  imgW = width * 0.12;
  imgH = imgW / RATIO;
  groundY = height * 0.82;
  gravity = height * 0.0006;

  playerX = width * 0.15;
  playerY = groundY;

  // Init volume history
  for (let i = 0; i < VOL_HISTORY_LEN; i++) volHistory.push(0);

  // Generate background elements
  generateStars();
  generateClouds();
  generateMountains();
  generateGrass();
  spawnOrbs();
}

// ============================================================
//  BACKGROUND GENERATORS
// ============================================================
function generateStars() {
  stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.6),
      size: random(1, 3.5),
      twinkleSpeed: random(0.02, 0.06),
      twinkleOffset: random(TWO_PI),
      hue: random([0, 40, 200, 260, 300])
    });
  }
}

function generateClouds() {
  clouds = [];
  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: random(width),
      y: random(height * 0.08, height * 0.35),
      w: random(width * 0.1, width * 0.25),
      speed: random(0.15, 0.5),
      opacity: random(0.03, 0.08)
    });
  }
}

function generateMountains() {
  mountains = [];
  // Back layer
  for (let x = 0; x < width + 100; x += random(80, 160)) {
    mountains.push({
      x: x,
      h: random(height * 0.15, height * 0.3),
      w: random(120, 250),
      layer: 0,
      hue: 250
    });
  }
  // Front layer
  for (let x = 0; x < width + 100; x += random(60, 130)) {
    mountains.push({
      x: x,
      h: random(height * 0.08, height * 0.18),
      w: random(80, 180),
      layer: 1,
      hue: 270
    });
  }
}

function generateGrass() {
  grassBlades = [];
  for (let i = 0; i < 200; i++) {
    grassBlades.push({
      x: random(width),
      h: random(8, 25),
      sway: random(TWO_PI),
      swaySpeed: random(0.02, 0.05),
      hue: random(100, 150)
    });
  }
}

// ============================================================
//  ORB SPAWNING
// ============================================================
function spawnOrbs() {
  orbs = [];
  for (let i = 0; i < orbCount; i++) {
    let ox, oy;
    // Spread orbs across the playfield, some high, some low
    ox = random(width * 0.25, width * 0.9);
    oy = random(groundY - height * 0.55, groundY - height * 0.05);
    orbs.push({
      x: ox,
      y: oy,
      collected: false,
      size: width * 0.04,
      hue: map(i, 0, orbCount, 0, 300),
      floatOffset: random(TWO_PI)
    });
  }
}

// ============================================================
//  PARTICLE SYSTEM
// ============================================================
function spawnParticles(px, py, count, hue, type) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: px,
      y: py,
      vx: random(-3, 3) * (type === "dust" ? 0.5 : 1),
      vy: random(-4, -0.5) * (type === "dust" ? 0.3 : 1),
      life: 1,
      decay: random(0.015, 0.04),
      size: random(3, type === "sparkle" ? 10 : 6),
      hue: hue + random(-20, 20),
      type: type
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.type === "dust") p.vy -= 0.05;
    else p.vy += 0.08;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  noStroke();
  for (let p of particles) {
    let alpha = p.life;
    if (p.type === "sparkle") {
      // Glowing sparkle
      fill(p.hue % 360, 80, 100, alpha * 0.3);
      circle(p.x, p.y, p.size * 2.5);
      fill(p.hue % 360, 50, 100, alpha);
      circle(p.x, p.y, p.size);
    } else {
      fill(p.hue % 360, 30, 80, alpha * 0.6);
      circle(p.x, p.y, p.size);
    }
  }
}

// ============================================================
//  SCREEN SHAKE
// ============================================================
function triggerShake(amount, duration) {
  shakeAmount = amount;
  shakeDuration = duration;
}

function applyShake() {
  if (shakeDuration > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeDuration--;
    shakeAmount *= 0.9;
  }
}

// ============================================================
//  DRAW — MAIN LOOP
// ============================================================
function draw() {
  // --- Audio ---
  vol = mic.getLevel();
  smoothVol = lerp(smoothVol, vol * volSensitivity, 0.3);
  volHistory.push(smoothVol);
  if (volHistory.length > VOL_HISTORY_LEN) volHistory.shift();

  // --- Background ---
  drawSky();

  push();
  applyShake();

  drawStars();
  drawClouds();
  drawMountains();

  // --- State Machine ---
  switch (gameState) {
    case STATE_TITLE:
      drawGround();
      drawGrass();
      drawTitleScreen();
      break;
    case STATE_PLAYING:
      updatePlayer();
      drawGround();
      drawGrass();
      drawOrbs();
      drawPlayer();
      drawParticles();
      updateParticles();
      checkOrbCollisions();
      drawHUD();
      drawVolumeMeter();
      break;
    case STATE_LEVELUP:
      drawGround();
      drawGrass();
      drawPlayer();
      drawParticles();
      updateParticles();
      drawLevelUp();
      break;
    case STATE_ANGEL:
      drawGround();
      drawGrass();
      drawPlayer();
      drawParticles();
      updateParticles();
      drawAngel();
      break;
  }

  pop();

  // Combo decay
  if (comboTimer > 0) comboTimer--;
  if (comboTimer <= 0) combo = 0;
}

// ============================================================
//  SKY & BACKGROUND
// ============================================================
function drawSky() {
  // Gradient sky — deep purple to dark blue
  for (let i = 0; i <= height; i++) {
    let t = i / height;
    let h = lerp(260, 220, t);
    let s = lerp(60, 40, t);
    let b = lerp(12, 25, t);
    stroke(h, s, b);
    line(0, i, width, i);
  }
}

function drawStars() {
  noStroke();
  for (let s of stars) {
    let twinkle = (sin(frameCount * s.twinkleSpeed + s.twinkleOffset) + 1) * 0.5;
    let alpha = 0.3 + twinkle * 0.7;
    fill(s.hue, 20, 100, alpha);
    circle(s.x, s.y, s.size * (0.7 + twinkle * 0.3));
    // Tiny glow
    fill(s.hue, 15, 100, alpha * 0.15);
    circle(s.x, s.y, s.size * 3);
  }
}

function drawClouds() {
  noStroke();
  for (let c of clouds) {
    c.x -= c.speed;
    if (c.x + c.w < 0) c.x = width + c.w;
    fill(240, 20, 90, c.opacity);
    ellipse(c.x, c.y, c.w, c.w * 0.35);
    ellipse(c.x + c.w * 0.2, c.y - c.w * 0.08, c.w * 0.7, c.w * 0.3);
    ellipse(c.x - c.w * 0.15, c.y + c.w * 0.04, c.w * 0.5, c.w * 0.25);
  }
}

function drawMountains() {
  noStroke();
  for (let m of mountains) {
    let bright = m.layer === 0 ? 18 : 22;
    fill(m.hue, 30, bright, 0.7);
    triangle(
      m.x - m.w / 2, groundY,
      m.x, groundY - m.h,
      m.x + m.w / 2, groundY
    );
  }
}

function drawGround() {
  // Main ground
  noStroke();
  fill(140, 45, 28);
  rect(0, groundY, width, height - groundY);

  // Ground top edge — lighter strip
  fill(130, 50, 38);
  rect(0, groundY, width, 6);

  // Subtle dirt texture
  fill(30, 40, 22);
  rect(0, groundY + 6, width, height - groundY - 6);

  // Dark earthy bottom
  fill(20, 35, 15);
  rect(0, height * 0.92, width, height * 0.08);
}

function drawGrass() {
  strokeWeight(2);
  for (let g of grassBlades) {
    g.sway += g.swaySpeed;
    let swayX = sin(g.sway) * 3;
    stroke(g.hue, 55, 40, 0.7);
    line(g.x, groundY, g.x + swayX, groundY - g.h);
  }
  strokeWeight(1);
}

// ============================================================
//  TITLE SCREEN
// ============================================================
function drawTitleScreen() {
  titleBounce += 0.04;

  // Draw Ubie in the center, gently bouncing
  let titleUbieY = height * 0.45 + sin(titleBounce) * 15;
  let titleUbieSize = imgW * 1.8;
  image(ubie, width * 0.5, titleUbieY, titleUbieSize, titleUbieSize / RATIO);

  // Glow behind Ubie
  noStroke();
  fill(40, 70, 100, 0.05 + sin(titleBounce * 2) * 0.03);
  circle(width * 0.5, titleUbieY, titleUbieSize * 2.5);

  // Title
  textAlign(CENTER, CENTER);
  textSize(width * 0.07);
  noStroke();

  // Title shadow
  fill(0, 0, 0, 0.4);
  text("UBIE", width * 0.5 + 3, height * 0.14 + 3);

  // Title text with glow
  fill(45, 90, 100);
  text("UBIE", width * 0.5, height * 0.14);

  // Subtitle
  textSize(width * 0.025);
  fill(200, 50, 90, 0.9);
  text("A U D I O   G A M E", width * 0.5, height * 0.22);

  // Instructions
  textSize(width * 0.018);
  fill(0, 0, 90, 0.7);
  textLeading(height * 0.055);
  text(
    "Use your VOICE to move Ubie!\n" +
    "Soft sound = Run right\n" +
    "Medium sound = Roll left\n" +
    "LOUD sound = Jump up!\n" +
    "Down Arrow = Fall down",
    width * 0.5,
    height * 0.72
  );

  // Click prompt — pulsing
  let pulse = (sin(frameCount * 0.06) + 1) * 0.5;
  textSize(width * 0.03);
  fill(40, 80, 100, 0.5 + pulse * 0.5);
  text("[ Click anywhere to start ]", width * 0.5, height * 0.92);

  // Volume sensitivity hint
  textSize(width * 0.012);
  fill(0, 0, 70, 0.5);
  text("Press + / - to adjust mic sensitivity", width * 0.5, height * 0.97);
}

// ============================================================
//  PLAYER UPDATE
// ============================================================
function updatePlayer() {
  let nv = smoothVol;

  // Determine action from volume
  if (nv < 0.5) {
    playerAction = "still";
  } else if (nv >= 0.5 && nv <= 1.2) {
    playerAction = "run";
  } else if (nv > 1.2 && nv <= 4.5) {
    playerAction = "roll";
  } else if (nv > 4.5) {
    playerAction = "jump";
  }

  // Movement
  let speed = width * 0.005;

  switch (playerAction) {
    case "run":
      playerVX = speed;
      facingRight = true;
      // Dust particles
      if (frameCount % 6 === 0 && isGrounded) {
        spawnParticles(playerX - imgW * 0.3, playerY + imgH * 0.4, 3, 30, "dust");
      }
      break;
    case "roll":
      playerVX = -speed;
      facingRight = false;
      if (frameCount % 4 === 0 && isGrounded) {
        spawnParticles(playerX + imgW * 0.3, playerY + imgH * 0.4, 2, 200, "dust");
      }
      break;
    case "jump":
      if (isGrounded) {
        playerVY = -height * 0.018;
        isGrounded = false;
        spawnParticles(playerX, playerY + imgH * 0.4, 12, 50, "sparkle");
      }
      break;
    default:
      playerVX *= 0.85; // friction
  }

  // Down arrow
  if (keyIsPressed && keyCode === DOWN_ARROW) {
    playerVY += height * 0.001;
  }

  // Apply gravity
  if (!isGrounded) {
    playerVY += gravity;
  }

  // Apply velocity
  playerX += playerVX;
  playerY += playerVY;

  // Friction on X
  if (playerAction !== "run" && playerAction !== "roll") {
    playerVX *= 0.88;
  }

  // Ground collision
  if (playerY >= groundY) {
    playerY = groundY;
    playerVY = 0;
    if (!isGrounded) {
      // Landing particles
      spawnParticles(playerX, groundY, 8, 30, "dust");
    }
    isGrounded = true;
  }

  // Wrap horizontally
  if (playerX > width + imgW) playerX = -imgW;
  if (playerX < -imgW) playerX = width + imgW;

  // Angel mode — flew off the top
  if (playerY < -imgH) {
    gameState = STATE_ANGEL;
    stateTimer = 240;
    spawnParticles(playerX, 0, 30, 50, "sparkle");
    triggerShake(8, 20);
  }

  // Advance animation frames
  animTimer++;
  if (animTimer >= ANIM_SPEED) {
    animTimer = 0;
    indexRun = (indexRun + 1) % ubieR.length;
    indexJump = (indexJump + 1) % ubieJ.length;
    indexRoll = (indexRoll + 1) % ubieRo.length;
  }
}

// ============================================================
//  DRAW PLAYER
// ============================================================
function drawPlayer() {
  let sprite;
  switch (playerAction) {
    case "run":   sprite = ubieR[indexRun]; break;
    case "jump":  sprite = ubieJ[indexJump]; break;
    case "roll":  sprite = ubieRo[indexRoll]; break;
    default:      sprite = ubie; break;
  }

  push();
  translate(playerX, playerY);

  // Shadow on ground
  noStroke();
  let shadowDist = abs(playerY - groundY);
  let shadowAlpha = map(shadowDist, 0, height * 0.5, 0.3, 0);
  let shadowScale = map(shadowDist, 0, height * 0.5, 1, 0.4);
  fill(0, 0, 0, max(0, shadowAlpha));
  ellipse(0, groundY - playerY + 5, imgW * shadowScale, imgH * 0.15 * shadowScale);

  // Glow when jumping
  if (playerAction === "jump" && !isGrounded) {
    fill(50, 80, 100, 0.08);
    circle(0, 0, imgW * 2);
  }

  // Flip sprite if facing left
  if (!facingRight) {
    scale(-1, 1);
  }

  image(sprite, 0, 0, imgW, imgH);
  pop();
}

// ============================================================
//  ORBS
// ============================================================
function drawOrbs() {
  orbPulse += 0.05;

  for (let orb of orbs) {
    if (orb.collected) continue;

    let floatY = orb.y + sin(frameCount * 0.03 + orb.floatOffset) * 8;
    let pulse = (sin(orbPulse + orb.floatOffset) + 1) * 0.5;
    let sz = orb.size * (0.85 + pulse * 0.15);

    // Outer glow
    noStroke();
    fill(orb.hue, 60, 100, 0.06);
    circle(orb.x, floatY, sz * 4);
    fill(orb.hue, 70, 100, 0.12);
    circle(orb.x, floatY, sz * 2.2);

    // Core
    fill(orb.hue, 80, 100, 0.9);
    circle(orb.x, floatY, sz);

    // Inner bright spot
    fill(orb.hue, 30, 100, 0.8);
    circle(orb.x - sz * 0.15, floatY - sz * 0.15, sz * 0.35);

    // Ring
    noFill();
    stroke(orb.hue, 60, 100, 0.2 + pulse * 0.2);
    strokeWeight(2);
    circle(orb.x, floatY, sz * (1.5 + pulse * 0.5));
  }
}

function checkOrbCollisions() {
  for (let orb of orbs) {
    if (orb.collected) continue;

    let floatY = orb.y + sin(frameCount * 0.03 + orb.floatOffset) * 8;
    let d = dist(playerX, playerY, orb.x, floatY);

    if (d < orb.size * 0.8 + imgW * 0.3) {
      orb.collected = true;

      // Score with combo
      let timeSinceLast = millis() - lastCollectTime;
      if (timeSinceLast < 3000 && combo > 0) {
        combo++;
      } else {
        combo = 1;
      }
      comboTimer = 120;
      lastCollectTime = millis();

      let points = 100 * combo * level;
      score += points;
      if (score > highScore) highScore = score;

      // Effects
      spawnParticles(orb.x, floatY, 25, orb.hue, "sparkle");
      triggerShake(5, 10);

      // Check level complete
      if (orbs.every(o => o.collected)) {
        gameState = STATE_LEVELUP;
        stateTimer = 180;
        level++;
        orbCount = min(orbCount + 1, 8);
        triggerShake(10, 20);
        spawnParticles(playerX, playerY, 40, 45, "sparkle");
      }
    }
  }
}

// ============================================================
//  HUD
// ============================================================
function drawHUD() {
  // Score
  noStroke();
  textAlign(LEFT, TOP);
  textSize(width * 0.025);

  // Score shadow
  fill(0, 0, 0, 0.3);
  text("SCORE: " + score, 23, 23);
  fill(45, 80, 100);
  text("SCORE: " + score, 20, 20);

  // Level
  textSize(width * 0.018);
  fill(200, 60, 90);
  text("LEVEL " + level, 20, 20 + width * 0.035);

  // High score
  textAlign(RIGHT, TOP);
  textSize(width * 0.015);
  fill(0, 0, 80, 0.6);
  text("BEST: " + highScore, width - 20, 20);

  // Orbs remaining
  let remaining = orbs.filter(o => !o.collected).length;
  textAlign(RIGHT, TOP);
  textSize(width * 0.018);
  fill(300, 60, 100);
  text("ORBS: " + remaining + " / " + orbs.length, width - 20, 20 + width * 0.022);

  // Combo display
  if (combo > 1 && comboTimer > 0) {
    textAlign(CENTER, CENTER);
    let comboAlpha = min(1, comboTimer / 30);
    let comboSize = width * 0.04 + (combo - 1) * width * 0.005;
    textSize(min(comboSize, width * 0.08));
    fill(30, 90, 100, comboAlpha);
    text(combo + "x COMBO!", width * 0.5, height * 0.12);
  }

  // Sensitivity display
  textAlign(LEFT, BOTTOM);
  textSize(width * 0.012);
  fill(0, 0, 60, 0.5);
  text("Sensitivity: " + volSensitivity + "  (+/- to adjust)", 20, height - 15);
}

// ============================================================
//  VOLUME METER
// ============================================================
function drawVolumeMeter() {
  let meterX = width - 45;
  let meterH = height * 0.35;
  let meterY = height * 0.4;
  let meterW = 14;

  // Background bar
  noStroke();
  fill(0, 0, 20, 0.5);
  rect(meterX - meterW / 2, meterY, meterW, meterH, 7);

  // Volume fill
  let fillH = constrain(map(smoothVol, 0, 6, 0, meterH), 0, meterH);
  let volHue = map(fillH, 0, meterH, 120, 0); // green -> red

  // Glow
  fill(volHue, 70, 100, 0.1);
  rect(meterX - meterW, meterY + meterH - fillH - 5, meterW * 2, fillH + 10, 7);

  // Fill
  fill(volHue, 80, 90);
  rect(meterX - meterW / 2, meterY + meterH - fillH, meterW, fillH, 7);

  // Threshold lines
  stroke(0, 0, 60, 0.3);
  strokeWeight(1);
  let thresholds = [
    { val: 0.5, label: "Run" },
    { val: 1.2, label: "Roll" },
    { val: 4.5, label: "Jump" }
  ];
  for (let t of thresholds) {
    let ty = meterY + meterH - constrain(map(t.val, 0, 6, 0, meterH), 0, meterH);
    line(meterX - meterW, ty, meterX + meterW, ty);
    noStroke();
    textAlign(RIGHT, CENTER);
    textSize(9);
    fill(0, 0, 70, 0.5);
    text(t.label, meterX - meterW - 4, ty);
    stroke(0, 0, 60, 0.3);
  }

  // Waveform mini-display
  noFill();
  stroke(180, 60, 80, 0.4);
  strokeWeight(1.5);
  beginShape();
  for (let i = 0; i < volHistory.length; i++) {
    let wx = map(i, 0, volHistory.length - 1, 20, 20 + width * 0.12);
    let wy = height - 40 - volHistory[i] * 15;
    vertex(wx, constrain(wy, height - 100, height - 25));
  }
  endShape();
  strokeWeight(1);
}

// ============================================================
//  LEVEL UP SCREEN
// ============================================================
function drawLevelUp() {
  stateTimer--;

  // Celebratory particles
  if (frameCount % 3 === 0) {
    spawnParticles(random(width), random(height * 0.3), 2, random(360), "sparkle");
  }

  // Overlay
  noStroke();
  fill(0, 0, 0, 0.3);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);

  // "LEVEL UP" text
  let bounce = sin(frameCount * 0.08) * 10;
  textSize(width * 0.08);
  fill(45, 90, 100);
  text("LEVEL " + level + "!", width * 0.5, height * 0.4 + bounce);

  textSize(width * 0.025);
  fill(0, 0, 95, 0.8);
  text("Score: " + score, width * 0.5, height * 0.55);

  if (stateTimer <= 0) {
    gameState = STATE_PLAYING;
    playerX = width * 0.15;
    playerY = groundY;
    playerVX = 0;
    playerVY = 0;
    isGrounded = true;
    spawnOrbs();
  }
}

// ============================================================
//  ANGEL SCREEN
// ============================================================
function drawAngel() {
  stateTimer--;

  noStroke();
  fill(0, 0, 0, 0.2);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textSize(width * 0.04);

  let glow = (sin(frameCount * 0.05) + 1) * 0.5;
  fill(45, 60 + glow * 30, 100);
  text("You have the voice\nof an ANGEL!", width * 0.5, height * 0.4);

  textSize(width * 0.02);
  fill(0, 0, 90, 0.6);
  text("+500 BONUS!", width * 0.5, height * 0.55);

  if (stateTimer === 200) {
    score += 500;
    if (score > highScore) highScore = score;
  }

  // Sparkle rain
  if (frameCount % 2 === 0) {
    spawnParticles(random(width), random(height * 0.5), 1, random(30, 60), "sparkle");
  }

  if (stateTimer <= 0) {
    gameState = STATE_PLAYING;
    playerX = width * 0.15;
    playerY = groundY;
    playerVX = 0;
    playerVY = 0;
    isGrounded = true;
  }
}

// ============================================================
//  INPUT
// ============================================================
function mousePressed() {
  userStartAudio();

  if (gameState === STATE_TITLE) {
    gameState = STATE_PLAYING;
    score = 0;
    level = 1;
    combo = 0;
    orbCount = 3;
    playerX = width * 0.15;
    playerY = groundY;
    playerVX = 0;
    playerVY = 0;
    spawnOrbs();
  }
}

function keyPressed() {
  if (key === "+" || key === "=") {
    volSensitivity = min(volSensitivity + 2, 100);
  }
  if (key === "-" || key === "_") {
    volSensitivity = max(volSensitivity - 2, 2);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  imgW = width * 0.12;
  imgH = imgW / RATIO;
  groundY = height * 0.82;
  gravity = height * 0.0006;
  generateStars();
  generateClouds();
  generateMountains();
  generateGrass();
}
