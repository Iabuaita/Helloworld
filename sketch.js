// Duel animation variables
let animationState = "toPassMe"; // Track current animation state
let fadeAlpha = 0; // Alpha value for fade-in/out
let fadeDirection = 1; // 1 for fade-in, -1 for fade-out
let messageTimer = 0; // Timer to control message transitions

// Game variables
let gameStarted = false;
let gameOver = false;
let rewardEarned = false;
let foodX,
  foodY,
  foodSize = 70,
  score = 0,
  timer = 15,
  targetScore = 10;
let countdown;
let emojis = ["🍔", "🍕", "🍎", "🍩", "🍗"];
let currentEmoji = "🍔";
let rewardTimer;

// Untouched Screen Variables
let bodySegmentation;
let video;
let segmentation;
let state = "No Object Detected"; // Initial state
let previousMask; // Store previous mask for comparison
let eyeOpening = 1; // Initial eye opening value (1 = fully open)
let eyeOpeningSpeed = 0.01; // Speed of eye opening/closing
let blinking = false; // Whether the eyes are blinking
let stars = []; // Array to store star positions
let snoreZzz = []; // Array to store snore "Z" data

let options = {
  maskType: "parts",
};

function preload() {
  bodySegmentation = ml5.bodySegmentation("BodyPix", options);
}

function compareMasks(mask1, mask2) {
  mask1.loadPixels();
  mask2.loadPixels();

  let changes = 0;
  for (let i = 0; i < mask1.pixels.length; i += 4) {
    let diff = abs(mask1.pixels[i] - mask2.pixels[i]);
    if (diff > 20) changes++;
  }

  return changes > 1000;
}

function gotResults(result) {
  segmentation = result;

  if (segmentation && segmentation.mask) {
    let currentMask = segmentation.mask;

    if (previousMask) {
      let movementDetected = compareMasks(previousMask, currentMask);
      state = movementDetected ? "Object Detected" : "No Object Detected";
    }

    previousMask = currentMask;
  }

  bodySegmentation.detectStart(video, gotResults);
}

// === Wi-Fi Communication Variables ===
let touched = false;
const client = mqtt.connect("ws://23.21.151.236:9001");

// === MQTT Connection Handling ===
client.on("connect", () => {
  console.log("Connected to MQTT broker");
  client.subscribe("helloworld/touched");
  client.publish("helloworld/connect", "Browser connected");
});
client.on("message", (topic, message) => {
  const msg = message.toString();
  if (topic === "helloworld/touched") {
    handleTouch(msg);
  }
});

// === Input Handling ===
function handleTouch(value) {
  if (value === "on") {
    touched = true;
  } else if (value === "off") {
    touched = false;
  }
  client.publish("helloworld/touched/handled", "Touch message handled");
}
function mousePressed() {
  if (rewardEarned) {
    // If the reward screen is active, prevent interactions
    console.log("Reward screen is active - no actions allowed.");
    return; // Exit the function early
  }

  if (animationState === "letsDuelButton") {
    // Handle "Let's Duel" button click
    let d = dist(mouseX, mouseY, width / 2, height / 2 + 100); // Distance from button center
    if (d < 150) {
      // Button radius
      startGame(); // Start the game
    }
  } else if (gameStarted) {
    // Check if the click is inside the emoji (target)
    let d = dist(mouseX, mouseY, foodX, foodY); // Distance from emoji center
    if (d < foodSize / 2) {
      score++; // Increment score
      generateFoodPosition(); // Generate a new emoji position
    }
  } else if (gameOver) {
    // Handle clicks on the "Try Again" button after losing
    let d = dist(mouseX, mouseY, width / 2, height / 2 + 60); // Distance from button center
    if (d < 100) {
      // Button radius
      resetGame(); // Reset and restart the game
    }
  }
}

// === p5.js Setup Function ===
function setup() {
  createCanvas(windowWidth, windowHeight);

  // Initialize Video for Segmentation
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  bodySegmentation = ml5.bodySegmentation("BodyPix", options);
  bodySegmentation.detectStart(video, gotResults);

  // Initialize stars and snore animations
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      opacity: random(100, 200),
    });
  }
  snoreZzz.push(generateSnoreZ(0, 48));
  snoreZzz.push(generateSnoreZ(40, 36));
  snoreZzz.push(generateSnoreZ(80, 24));
}

// === Handle Window Resize ===
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Re-adjust video dimensions after resize
  video.size(width, height);

  // Optional: Re-calculate positions of stars or other elements if necessary
  stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      opacity: random(100, 200),
    });
  }
}

// === Untouched Screen Functions ===
function displayUntouchedScreen() {
  drawNightBackground(); // Draw night gradient
  drawStars(); // Draw stars
  drawClock(); // Draw the clock at the bottom center
  drawEyes(state === "Object Detected"); // Draw eyes or lines based on the state

  if (state === "No Object Detected") {
    updateSnoreZzz(); // Update the animation
    drawSnore(); // Render the Zzz
    displayMessage(); // Display a sentence above the clock
  }
}
function drawNightBackground() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(0, 0, 50), color(0, 0, 150), inter);
    stroke(c);
    line(0, y, width, y);
  }
}
function drawStars() {
  for (let star of stars) {
    star.opacity += random(-5, 5);
    star.opacity = constrain(star.opacity, 100, 200);

    fill(255, star.opacity);
    noStroke();
    ellipse(star.x, star.y, star.size, star.size);
  }
}
function drawEyes(isAwake) {
  let eyeY = height / 2; // Vertical position of the eyes
  let eyeXOffset = width / 6; // Horizontal offset for the eyes
  let eyeWidth = width / 8; // Width of the eye
  let eyeHeight = map(eyeOpening, 0, 1, height / 50, height / 12); // Height of the eye (dynamic)
  let pupilSize = eyeHeight / 2; // Pupil size proportional to eye height

  // Static variables for pupil movement
  if (typeof drawEyes.pupilOffset === "undefined") {
    drawEyes.pupilOffset = { x: 0, y: 0 }; // Initial pupil offset
    drawEyes.pupilDirection = { x: random(-1, 1), y: random(-1, 1) }; // Random direction for pupils
  }

  if (isAwake) {
    eyeOpening = min(1, eyeOpening + eyeOpeningSpeed); // Smoothly open the eyes

    // Update pupil offset with random motion
    drawEyes.pupilDirection.x += random(-0.05, 0.05);
    drawEyes.pupilDirection.y += random(-0.05, 0.05);
    drawEyes.pupilDirection.x = constrain(drawEyes.pupilDirection.x, -1, 1);
    drawEyes.pupilDirection.y = constrain(drawEyes.pupilDirection.y, -1, 1);

    // Reverse direction if the offset exceeds bounds
    if (abs(drawEyes.pupilOffset.x) > 15) drawEyes.pupilDirection.x *= -1;
    if (abs(drawEyes.pupilOffset.y) > 8) drawEyes.pupilDirection.y *= -1;

    drawEyes.pupilOffset.x += drawEyes.pupilDirection.x;
    drawEyes.pupilOffset.y += drawEyes.pupilDirection.y;

    // Draw left eye
    fill(255); // White for the eye
    ellipse(width / 2 - eyeXOffset, eyeY, eyeWidth, eyeHeight);

    // Draw left pupil
    fill(0); // Black for the pupil
    ellipse(
      width / 2 - eyeXOffset + drawEyes.pupilOffset.x,
      eyeY + drawEyes.pupilOffset.y,
      pupilSize,
      pupilSize
    );

    // Draw right eye
    fill(255); // White for the eye
    ellipse(width / 2 + eyeXOffset, eyeY, eyeWidth, eyeHeight);

    // Draw right pupil
    fill(0); // Black for the pupil
    ellipse(
      width / 2 + eyeXOffset + drawEyes.pupilOffset.x,
      eyeY + drawEyes.pupilOffset.y,
      pupilSize,
      pupilSize
    );
  } else {
    eyeOpening = max(0, eyeOpening - eyeOpeningSpeed); // Smoothly close the eyes

    // Draw sleeping eyes as lines
    stroke(255); // White color for the lines
    strokeWeight(4);

    // Left eye closed line
    line(
      width / 2 - eyeXOffset - eyeWidth / 2,
      eyeY,
      width / 2 - eyeXOffset + eyeWidth / 2,
      eyeY
    );

    // Right eye closed line
    line(
      width / 2 + eyeXOffset - eyeWidth / 2,
      eyeY,
      width / 2 + eyeXOffset + eyeWidth / 2,
      eyeY
    );
  }
}
function drawSnore() {
  for (let z of snoreZzz) {
    fill(255, z.opacity);
    textSize(z.size);
    textAlign(CENTER, CENTER);
    text("Z", z.x, z.y);
  }
}
function generateSnoreZ(offsetY, size) {
  return {
    x: width / 2,
    y: height / 2 - 100 - offsetY,
    opacity: 255,
    size: size,
  };
}
function updateSnoreZzz() {
  for (let z of snoreZzz) {
    z.y -= 1;
    z.opacity -= 3;
  }

  if (snoreZzz[0] && snoreZzz[0].opacity <= 0) {
    snoreZzz.shift();
    snoreZzz.push(generateSnoreZ(-40, 24));
  }
}
function displayMessage() {
  fill(255); // White text
  textSize(width / 25); // Adjust text size dynamically
  textAlign(CENTER, CENTER); // Center align the text

  if (state === "No Object Detected") {
    text("All clear. I'm watching over you!", width / 2, height * 0.1);
  } else {
    text("Hey! Who's there?", width / 2, height * 0.1);
  }
}
function drawClock() {
  let h = nf(hour(), 2); // Hours with leading zero
  let m = nf(minute(), 2); // Minutes with leading zero
  let s = nf(second(), 2); // Seconds with leading zero

  let timeString = `${h}:${m}:${s}`; // Time in HH:MM:SS format

  let pixelSize = 7; // Size of each pixel
  let startX = width / 2 - (timeString.length * 6 * pixelSize) / 2; // Center alignment
  let startY = height - 60; // Placement near the bottom

  noStroke();
  fill(255); // White color for clock

  // Draw each character as a grid of rectangles
  for (let i = 0; i < timeString.length; i++) {
    let char = timeString[i];
    drawPixelatedChar(char, startX + i * 6 * pixelSize, startY, pixelSize);
  }
}
function drawPixelatedChar(char, x, y, pixelSize) {
  let charMap = getCharMap(char);

  for (let row = 0; row < charMap.length; row++) {
    for (let col = 0; col < charMap[row].length; col++) {
      if (charMap[row][col] === 1) {
        rect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}
function getCharMap(char) {
  const charMaps = {
    0: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
    ],
    1: [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ],
    2: [
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1],
    ],
    3: [
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
    4: [
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
    ],
    5: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
    6: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ],
    7: [
      [1, 1, 1],
      [0, 0, 1],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
    8: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ],
    9: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
    ":": [[0], [1], [0], [1], [0]],
  };

  return charMaps[char] || [[0]]; // Default empty grid for unknown characters
}

//////// Touched Screen Functions
// === Duel Screen Function ===
function displayDuelScreen() {
  background(50, 0, 50); // Set background color

  if (animationState === "toPassMe") {
    // Handle "TO PASS ME" animation
    fadeAlpha += fadeDirection * 1.5; // Adjust fading speed
    if (fadeAlpha >= 255) fadeDirection = -1; // Reverse direction at max alpha
    if (fadeAlpha <= 0) {
      fadeDirection = 1; // Reset direction
      animationState = "youNeedToDefeatMe"; // Move to next state
      messageTimer = millis(); // Record time for the next transition
    }

    // Display "TO PASS ME" text
    fill(255, fadeAlpha); // Apply fade effect
    textSize(48); // Set text size
    textAlign(CENTER, CENTER); // Center-align the text
    text("TO PASS ME,", width / 2, height / 2 - 60);
  } else if (animationState === "youNeedToDefeatMe") {
    // Handle "YOU NEED TO DEFEAT ME" animation
    if (millis() - messageTimer > 500) {
      fadeAlpha += fadeDirection * 1.5;
      if (fadeAlpha >= 255) fadeDirection = -1;
      if (fadeAlpha <= 0) {
        fadeDirection = 1;
        animationState = "letsDuelButton"; // Move to the button state
      }

      // Display "YOU NEED TO DEFEAT ME" text
      fill(255, fadeAlpha);
      textSize(48);
      textAlign(CENTER, CENTER);
      text("YOU NEED TO DEFEAT ME.", width / 2, height / 2);
    }
  } else if (animationState === "letsDuelButton") {
    // Handle "LET'S DUEL" button display
    fill(255);
    rectMode(CENTER); // Set rectangle drawing mode
    rect(width / 2, height / 2 + 100, 300, 80, 10); // Draw button with rounded corners

    // Draw button text
    fill(0); // Black text color
    textSize(36); // Button text size
    textAlign(CENTER, CENTER); // Center-align the text
    text("LET'S DUEL", width / 2, height / 2 + 100);
  }
}
// === Game Logic Functions ===
function startGame() {
  gameStarted = true;
  gameOver = false;
  rewardEarned = false;
  score = 0;
  timer = 15; // Game duration in seconds
  generateFoodPosition();
  countdown = setInterval(() => {
    timer--;
    if (timer <= 0) {
      endGame();
    }
  }, 1000);
}
function playFoodSmashGame() {
  background(220);
  textSize(foodSize);
  text(currentEmoji, foodX, foodY);
  textSize(24);
  textAlign(LEFT, TOP);
  text(`Score: ${score}`, 20, 20);
  textAlign(RIGHT, TOP);
  text(`Time: ${timer}s`, width - 20, 20);
}
function endGame() {
  gameStarted = false;
  gameOver = true;
  clearInterval(countdown);
  rewardEarned = score >= targetScore;
  if (rewardEarned) rewardTimer = 24 * 60 * 60; // 24 hours in seconds
}
function displayLoseScreen() {
  background(255, 0, 0); // Red background
  fill(255); // White text
  textSize(32);
  textAlign(CENTER, CENTER); // Center-align the text

  // Display "Game Over" and "You Didn't Score Enough"
  text("GAME OVER", width / 2, height / 2 - 60); // Adjusted vertical position for "GAME OVER"
  text("YOU DIDN'T SCORE ENOUGH!", width / 2, height / 2 - 20); // Adjusted vertical position

  // Draw the "Try Again" button
  rectMode(CENTER);
  fill(255); // White button background
  rect(width / 2, height / 2 + 60, 200, 60, 10); // Adjusted position and size of the button

  // Display "Try Again" text
  fill(0); // Black text
  textSize(24); // Slightly smaller text for the button
  text("TRY AGAIN", width / 2, height / 2 + 60); // Centered on the button
}
function generateFoodPosition() {
  foodX = random(foodSize / 2, width - foodSize / 2);
  foodY = random(foodSize / 2, height - foodSize / 2);
  currentEmoji = emojis[Math.floor(Math.random() * emojis.length)];
}
function formatTime(seconds) {
  const hours = floor(seconds / 3600);
  const minutes = floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${nf(hours, 2)}:${nf(minutes, 2)}:${nf(secs, 2)}`;
}
function displayRewardScreen() {
  background(0, 255, 0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("CONGRATULATIONS!", width / 2, height / 2 - 120);
  text("COME BACK TOMORROW FOR YOUR REWARD!", width / 2, height / 2 - 80);
  textSize(64);
  text("🎁", width / 2, height / 2 - 20);
  textSize(28);
  text(`Countdown: ${formatTime(rewardTimer)}`, width / 2, height / 2 + 40);
  if (frameCount % 60 === 0 && rewardTimer > 0) rewardTimer--;
}
function resetGame() {
  animationState = "toPassMe"; // Reset duel animation
  fadeAlpha = 0;
  gameOver = false;
  gameStarted = false;
  score = 0;
  timer = 15; // Reset game duration
}

// Function to process segmentation results
function gotResults(result) {
  segmentation = result;

  // Compare the current mask with the previous mask
  if (segmentation && segmentation.mask) {
    let currentMask = segmentation.mask;

    if (previousMask) {
      // Check for differences between masks
      let movementDetected = compareMasks(previousMask, currentMask);
      if (movementDetected) {
        state = "Object Detected";
      } else {
        state = "No Object Detected";
      }
    }

    previousMask = currentMask;
  }

  // Continue detecting
  bodySegmentation.detectStart(video, gotResults);
}

// Functions for Untouched Screen
function gotResults(result) {
  segmentation = result;
  if (segmentation && segmentation.mask) {
    let currentMask = segmentation.mask;
    state =
      previousMask && compareMasks(previousMask, currentMask)
        ? "Object Detected"
        : "No Object Detected";
    previousMask = currentMask;
  }
  bodySegmentation.detectStart(video, gotResults);
}

function mousePressed() {
  if (touched && !gameStarted && !gameOver) {
    startGame(); // Start the game after the duel screen
  } else if (gameStarted) {
    // Check if the click is inside the emoji (target)
    let d = dist(mouseX, mouseY, foodX, foodY);
    if (d < foodSize / 2) {
      score++; // Increment score
      generateFoodPosition(); // Generate a new food position and emoji
    }
  } else if (gameOver) {
    gameOver = false; // Reset the game over state
    startGame(); // Restart the game
  }
}

function draw() {
  if (touched) {
    // When the sensor is touched
    if (!gameStarted && !gameOver) {
      displayDuelScreen(); // Show the duel screen
    } else if (gameStarted) {
      playFoodSmashGame(); // Show the game
    } else if (gameOver && rewardEarned) {
      displayRewardScreen(); // Show the reward screen
    } else if (gameOver && !rewardEarned) {
      displayLoseScreen(); // Show the lose screen
    }
  } else {
    // When the sensor is not touched
    displayUntouchedScreen(); // Show the untouched screen
  }
}
