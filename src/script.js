// Game state
let score = 0;
let highScore = localStorage.getItem("sipaHighScore") || 0; // Load high score
let gameActive = false; // Start as false
let gameStarted = false; // Track if game has started
let lastKickTime = 0;
const kickCooldown = 100; // Shorter cooldown - kick faster!

// Animation state
let isKicking = false;

// DOM elements
let scoreDisplay,
  highScoreDisplay,
  gameOverDisplay,
  restartBtn,
  instructionsDisplay;

// Game entities
let rig, camera, sipa;
let sipaVelocity = { x: 0, y: 0, z: 0 };
const gravity = -0.02; // Faster gravity
const kickForce = 0.4; // VERY STRONG kick - you'll see it!
const groundLevel = 0.0; // Ground is at y=0

// Initialize when scene loads
document.addEventListener("DOMContentLoaded", function () {
  const scene = document.querySelector("a-scene");
  if (scene.hasLoaded) {
    initGame();
  } else {
    scene.addEventListener("loaded", initGame);
  }
});

function initGame() {
  scoreDisplay = document.getElementById("score");
  highScoreDisplay = document.getElementById("highScore");
  gameOverDisplay = document.getElementById("gameOver");
  restartBtn = document.getElementById("restartBtn");
  instructionsDisplay = document.getElementById("instructions");

  // Display high score
  highScoreDisplay.textContent = "High Score: " + highScore;

  rig = document.getElementById("rig");
  camera = document.getElementById("camera");
  sipa = document.getElementById("sipa");

  // Add keyboard listener for SPACEBAR to start game and kick
  window.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault(); // Prevent page scroll

      // First spacebar press starts the game
      if (!gameStarted) {
        gameStarted = true;
        gameActive = true;
        lastKickTime = 0; // Reset cooldown so first kick works!

        // Hide instructions
        instructionsDisplay.style.opacity = "0";
        setTimeout(() => {
          instructionsDisplay.style.display = "none";
        }, 500);

        // Also kick the Sipa immediately!
        handleSipaClick();
        return;
      }

      // After game started, spacebar kicks
      handleSipaClick();
    }
  });

  // Only click to kick - removed spacebar
  sipa.addEventListener("click", (evt) => {
    console.log("SIPA CLICKED!", evt);
    handleSipaClick();
  });
  sipa.addEventListener("mouseenter", () => {
    console.log("Mouse entered Sipa");
    if (gameActive) sipa.setAttribute("scale", "1.1 1.1 1.1");
  });
  sipa.addEventListener("mouseleave", () => {
    console.log("Mouse left Sipa");
    sipa.setAttribute("scale", "1 1 1");
  });
  restartBtn.addEventListener("click", restartGame);

  setTimeout(() => gameLoop(), 500);
}

function handleSipaClick() {
  if (!gameActive || Date.now() - lastKickTime < kickCooldown) {
    return;
  }
  lastKickTime = Date.now();

  sipaVelocity.y = kickForce + Math.random() * 0.05;
  sipaVelocity.x = (Math.random() - 0.5) * 0.15;
  sipaVelocity.z = (Math.random() - 0.5) * 0.15;

  sipa.setAttribute("scale", "1.2 1.2 1.2");
  setTimeout(() => sipa.setAttribute("scale", "1 1 1"), 100);

  score++;
  scoreDisplay.textContent = "Score: " + score;

  const glowingSphere = sipa.children[6];
  if (glowingSphere) {
    const originalColor = glowingSphere.getAttribute("color");
    glowingSphere.setAttribute("color", "#00FF00");
    setTimeout(() => glowingSphere.setAttribute("color", originalColor), 100);
  }
}

function gameLoop() {
  // Wait for game to start
  if (!gameStarted) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (!gameActive) return;

  const position = sipa.object3D.position;

  sipaVelocity.y += gravity;
  sipaVelocity.x *= 0.98;
  sipaVelocity.z *= 0.98;

  position.x += sipaVelocity.x;
  position.y += sipaVelocity.y;
  position.z += sipaVelocity.z;

  if (Math.abs(position.x) > 8) {
    position.x = Math.sign(position.x) * 8;
    sipaVelocity.x *= -0.5;
  }
  if (position.z > 5 || position.z < -10) {
    position.z = position.z > 5 ? 5 : -10;
    sipaVelocity.z *= -0.5;
  }

  if (position.y <= groundLevel) {
    endGame();
    return;
  }

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameActive = false;

  // Update high score if current score is higher
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("sipaHighScore", highScore);
    gameOverDisplay.innerHTML = `🎉 NEW HIGH SCORE! 🎉<br><span style="font-size: 28px;">Score: ${score}</span><br><button id="restartBtn" onclick="location.reload()">Play Again</button>`;
  } else {
    gameOverDisplay.innerHTML = `Game Over!<br><span style="font-size: 28px;">Score: ${score}</span><br><span style="font-size: 20px;">High Score: ${highScore}</span><br><button id="restartBtn" onclick="location.reload()">Play Again</button>`;
  }

  gameOverDisplay.style.display = "block";
  sipa.setAttribute(
    "animation",
    "property: position; to: 0 0 -2; dur: 1000; easing: easeInQuad"
  );
}

function restartGame() {
  score = 0;
  gameActive = false; // Stop game
  gameStarted = false; // Reset to waiting for spacebar
  lastKickTime = 0; // RESET COOLDOWN so first kick works!
  isKicking = false;
  scoreDisplay.textContent = "Score: 0";
  gameOverDisplay.style.display = "none";
  instructionsDisplay.style.display = "block";
  instructionsDisplay.style.opacity = "1";
  instructionsDisplay.style.color = "white";
  instructionsDisplay.textContent = "Press SPACEBAR to start!";

  rig.object3D.position.set(0, 0, 3);

  sipa.object3D.position.set(0, 3, -2); // Start much higher
  sipaVelocity = { x: 0, y: 0, z: 0 };
  sipa.removeAttribute("animation");
}
