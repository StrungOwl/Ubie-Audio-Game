//MAKE SURE COMPUTER VOLUME IS SET TO THE LAPTOP

let mic; //computer mic
let vol; //volume
let normalVol;
let volSensitivity = 10;
let volSlider; 

let xSpeed;
let x, y;
let xStart, yStart;
let imgW, imgH;

let ubie;
let ubieR = [];
let ubieJ = [];
let ubieRo = [];
let indexRun = 0;
let indexJump = 0;
let indexRoll = 0;

let ubieStill = true;
let ubieRun = false;
let ubieRoll = false;
let ubieJump = false;

//RED DOT
let redX, redY, redCircS;
let a = 0;
let dotShow = true;

let ratio = 1.3; //character size

let words;
let textShow = true;
let angelShow = false; 

function preload() {
  ubie = loadImage("Ubie.png");
  words = loadFont("font.ttf");

  //RUNNING
  for (let i = 1; i < 8; i++) {
    ubieR[i - 1] = loadImage("Run/Ubie_Run" + i + ".png");
  }

  //Jumping
  for (let i = 0; i < 2; i++) {
    ubieJ[i] = loadImage("Jump/" + i + ".png");
  }

  //ROLLING
  for (let i = 1; i < 15; i++) {
    ubieRo[i - 1] = loadImage("Roll/Ubie_Flip" + i + ".png");
  }
}

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  colorMode(HSB);
  getAudioContext().suspend();

  textFont(words);

  mic = new p5.AudioIn();
  mic.start();

  imgW = width * 0.15;
  imgH = imgW / ratio;

  xStart = width * 0.4 - imgW / 2;
  yStart = height / 1.2 - imgH / 2;

  x = xStart;
  y = yStart;
  xSpeed = width * 0.005;

  //RED DOT
  redX = width * 0.8;
  redY = height * 0.35;
  circS = width * 0.1;
  
  volSlider = createSlider(0, 100, 10, 1);
  volSlider.position(10, 10);
  
}

function draw() {
  background(147, 43, 68, 0.1);

  vol = mic.getLevel(); //grab volume, measures amplitude
  
  volSensitivity = volSlider.value(); 
  stroke(0);
  fill(204, 100, 100);
  text(volSensitivity, 160, 20);
  
  normalVol = vol * volSensitivity; //Change this number depending on value input

  console.log(vol);

  //VOLUME TRIGGERS THE BOOLEANS---------------------------------------

  //STANDING STILL
  if (normalVol < 1) {
    ubieStill = true;
    ubieRun = false;
    ubieRoll = false;
    ubieJump = false;
  }

  //GOING RIGHT
  if (normalVol >= 0.5 && normalVol <= 0.9) {
    ubieJump = false;
    ubieRoll = false;
    ubieStill = false;
    ubieRun = true;

    //GOING LEFT
  } else if (normalVol > 1.5 && normalVol <= 5) {
    ubieJump = false;
    ubieRoll = true;
    ubieStill = false;
    ubieRun = false;

    //GOING UP
  } else if (normalVol > 5) {
    ubieJump = true;
    ubieRoll = false;
    ubieStill = false;
    ubieRun = false;
  }

  //BOOLEANS CONTROL THE ANIMATION AND IMAGE
  //DRAW AND ANIMATE---------------------------------------------
  if (ubieStill) {
    ubieRoll = false;
    ubieJump = false;
    ubieRun = false;
    image(ubie, x, y, imgW, imgH);

    x += 0;
  } else if (ubieRun) {
    ubieRoll = false;
    ubieJump = false;
    ubieStill = false;
    image(ubieR[indexRun], x, y, imgW, imgH);

    x += xSpeed; // Update the x position

    indexRun++;
    if (indexRun >= ubieR.length) {
      indexRun = 0;
    }
  } else if (ubieJump) {
    ubieRoll = false;
    ubieRun = false;
    ubieStill = false;
    image(ubieJ[indexJump], x, y, imgW, imgH);
    indexJump++;
    if (indexJump >= ubieJ.length) {
      indexJump = 0;
    }

    y -= xSpeed; // Update the x position
  } else if (ubieRoll) {
    ubieJump = false;
    ubieRun = false;
    ubieStill = false;
    image(ubieRo[indexRoll], x, y, imgW, imgH);

    x -= xSpeed; // Update the x position

    indexRoll++;

    if (indexRoll >= ubieRo.length) {
      indexRoll = 0;
    }
  }

  if (keyIsPressed && keyCode == DOWN_ARROW) {
    y += xSpeed;
  }

  //CREATE BOUNDARIES FOR GAMEPLAY ----------------------------------------------
  if (x >= width + imgW / 2 || x <= -imgW/2) {
    x = xStart;
    y = yStart;
  }

  if (y <= -imgH/2) {
    angelShow = true; 
    dotShow = false;
    stroke(0);
    fill(204, 100, 100);
    textSize(width * 0.04);
    textAlign(CENTER, CENTER);
    text(
      "Congratulations! \n You have the voice of an angel!",
      width / 2,
      height / 2
    );

    setTimeout(() => {
      dotShow = true; // Turn on showDot after 2 seconds
      x = xStart;
      y = yStart;
    }, 4000);
  }

  if (dotShow) {
    //RED CIRCLE
    circS = sin(radians(a)) * width * 0.1;
    noStroke();
    fill(0, 100, 100, 0.8);
    circle(redX, redY, circS);

    a += 1;

    if (textShow) {
      stroke(0);
      fill(204, 100, 100);
      textSize(width * 0.04);
      textAlign(CENTER, CENTER);

      textLeading(height * 0.1);

      text(
        "Help me reach the dot! \n Try using your voice. \n Hint: Volume Matters",
        width * 0.3,
        height * 0.2
      );

      fill(204, 100, 80);

      text("Click to Start", width * 0.3, height * 0.45);
    }
  }

  // Calculate the distance between character & dot
  let distanceToRedDot = dist(abs(x), abs(y), redX, redY);

  //console.log(distanceToRedDot);

  // Check if the distance is small enough to hide the dot
  if (distanceToRedDot < height*0.18) {
    //width*0.18
    dotShow = false;

    stroke(0);
    fill(204, 100, 100);
    textSize(width * 0.15);
    textAlign(CENTER, CENTER);

    text("SUCCESS!", width * 0.5, height * 0.5);

    setTimeout(() => {
      dotShow = true; // Turn on showDot after 2 seconds
      x = xStart;
      y = yStart;
    }, 4000);
  }

  //NEED TO GO DOWN?
  if (y < redY - imgH) {
    stroke(0);
    fill(204, 100, 100);
    textSize(width * 0.04);
    textAlign(CENTER, CENTER);
    textLeading(height * 0.1);
    if(!angelShow){
    text("Need to go down? \n Press Down Arrow Key", width * 0.3, height * 0.2);
    }
  }
}

//ACTIVATE AUDIO IN

function mousePressed() {
  userStartAudio();
  textShow = !textShow;
}
