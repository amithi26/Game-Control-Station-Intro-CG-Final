import * as THREE from 'three';

// Pixelated rendering setup
const renderTargetResolution = { width: 320, height: 240 }; // low res
const renderTarget = new THREE.WebGLRenderTarget(
  renderTargetResolution.width,
  renderTargetResolution.height,
  { 
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBFormat 
  }
);

let highScore = localStorage.getItem('spaceShooterHighScore') || 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000033);

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ 
  color: 0xffffff,
  size: 1.5,
  sizeAttenuation: false
});
const starVertices = [];
for (let i = 0; i < 200; i++) {
    starVertices.push(
        THREE.MathUtils.randFloatSpread(200),
        THREE.MathUtils.randFloatSpread(200),
        THREE.MathUtils.randFloatSpread(200)
    );
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// static grid for background effect
const gridSize = 500;
 const gridDivisions = 100;
const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x0630a1, 0x0630a1);
gridHelper.position.y = -10;
gridHelper.position.z = -20; // Keep it behind the action
gridHelper.rotation.x = Math.PI / 2;
scene.add(gridHelper);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: false }); // turn off antialiasing for pixelation
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quadGeometry = new THREE.PlaneGeometry(2, 2);
const quadMaterial = new THREE.MeshBasicMaterial({
  map: renderTarget.texture
});
const quad = new THREE.Mesh(quadGeometry, quadMaterial);
const postScene = new THREE.Scene();
postScene.add(quad);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 1, 1);
scene.add(directionalLight);

function createSpaceship() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.6, 2);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x4477ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    const wingGeometry = new THREE.BoxGeometry(2, 0.2, 0.8);
    const wingMaterial = new THREE.MeshBasicMaterial({ color: 0x3355ee });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, 0, -0.5);
    group.add(leftWing);
    
    const cockpitGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.4);
    const cockpitMaterial = new THREE.MeshBasicMaterial({ color: 0x88aaff });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.3;
    cockpit.position.z = 0.5;
    group.add(cockpit);
    
    const engineGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const engineMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.z = -1.2;
    group.add(engine);
    
    return group;
}

const player = createSpaceship();
player.position.z = 5;
scene.add(player);

const bullets = [];
const bulletGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.6);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

const enemies = [];
const enemyGeometry = new THREE.BoxGeometry(1, 0.8, 1);
const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff3333 });

// game state
let gameActive = true;
let score = 0;
let totalScore = 0;
let isBlinking = false;

function formatScore(value) {
    return value.toString().padStart(2, '0');
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTotalScore = localStorage.getItem('totalSpaceScore');
    if (savedTotalScore !== null) {
        totalScore = parseInt(savedTotalScore);
    }
});

// retro UI
const gameUI = document.createElement('div');
gameUI.style.position = 'absolute';
gameUI.style.top = '0';
gameUI.style.left = '0';
gameUI.style.width = '100%';
gameUI.style.padding = '10px';
gameUI.style.boxSizing = 'border-box';
gameUI.style.fontFamily = "'Press Start 2P', monospace";
gameUI.style.fontSize = '16px';
gameUI.style.color = '#ffffff';
gameUI.style.textShadow = '2px 2px 0 #000';
gameUI.style.pointerEvents = 'none';
document.body.appendChild(gameUI);

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const scoreElement = document.createElement('div');
scoreElement.style.bottom = '20px';
//scoreElement.style.left = '50%';
scoreElement.style.transform = 'translateY(20%)';
scoreElement.style.fontFamily = "'Press Start 2P', monospace";
scoreElement.style.fontSize = '20px';
scoreElement.style.color = '#ffffff';
scoreElement.style.textShadow = '2px 2px 0 #000';
scoreElement.style.textAlign = 'center';
scoreElement.style.textAlign = 'absolute';
scoreElement.style.padding = '10px';
scoreElement.textContent = `SCORE: ${formatScore(score)}`;
gameUI.appendChild(scoreElement);

const highScoreElement = document.createElement('div');
highScoreElement.style.position = 'absolute';
highScoreElement.style.top = '20px';
highScoreElement.style.right = '20px';
highScoreElement.style.fontFamily = "'Press Start 2P', monospace";
highScoreElement.style.fontSize = '16px';
highScoreElement.style.color = '#ffffff';
highScoreElement.style.textShadow = '2px 2px 0 #000';
highScoreElement.textContent = `HI-SCORE: ${formatScore(highScore)}`;
gameUI.appendChild(highScoreElement);

const gameStartPopup = document.createElement('div');
gameStartPopup.style.position = 'absolute';
gameStartPopup.style.top = '50%';
gameStartPopup.style.left = '50%';
gameStartPopup.style.transform = 'translate(-50%, -50%)';
gameStartPopup.style.width = '320px';
gameStartPopup.style.backgroundColor = '#000';
gameStartPopup.style.border = '4px solid #fff';
gameStartPopup.style.fontFamily = "'Press Start 2P', monospace";
gameStartPopup.style.color = '#fff';
gameStartPopup.style.padding = '20px';
gameStartPopup.style.textAlign = 'center';
gameStartPopup.style.zIndex = '1000';

const gameTitle = document.createElement('div');
gameTitle.textContent = 'SPACE SHOOTER';
gameTitle.style.fontSize = '24px';
gameTitle.style.marginBottom = '20px';
gameTitle.style.color = '#00ffff';
gameStartPopup.appendChild(gameTitle);

const instructionsText = document.createElement('div');
instructionsText.textContent = 'DESTROY THE ENEMY SHIPS!';
instructionsText.style.fontSize = '16px';
instructionsText.style.marginBottom = '30px';
instructionsText.style.lineHeight = '1.5';
gameStartPopup.appendChild(instructionsText);

const controlsText = document.createElement('div');
controlsText.innerHTML = 'CONTROLS:<br>WASD or ARROWS: MOVE<br>SPACE: SHOOT';
controlsText.style.fontSize = '12px';
controlsText.style.marginBottom = '30px';
controlsText.style.lineHeight = '1.8';
gameStartPopup.appendChild(controlsText);

const startButton = document.createElement('button');
startButton.textContent = 'START GAME';
startButton.style.backgroundColor = '#000';
startButton.style.color = '#fff';
startButton.style.border = '2px solid #fff';
startButton.style.padding = '10px 20px';
startButton.style.fontFamily = "'Press Start 2P', monospace";
startButton.style.fontSize = '14px';
startButton.style.cursor = 'pointer';
startButton.style.marginBottom = '10px';
startButton.addEventListener('mouseenter', () => {
    startButton.style.backgroundColor = '#fff';
    startButton.style.color = '#000';
});
startButton.addEventListener('mouseleave', () => {
    startButton.style.backgroundColor = '#000';
    startButton.style.color = '#fff';
});
startButton.addEventListener('click', () => {
    gameStartPopup.style.display = 'none';
    gameActive = true;
    playSound('shoot');
});
gameStartPopup.appendChild(startButton);
document.body.appendChild(gameStartPopup);
gameStartPopup.style.display = 'block';
gameActive = false;

const gameOverPopup = document.createElement('div');
gameOverPopup.style.position = 'absolute';
gameOverPopup.style.top = '50%';
gameOverPopup.style.left = '50%';
gameOverPopup.style.transform = 'translate(-50%, -50%)';
gameOverPopup.style.width = '320px';
gameOverPopup.style.backgroundColor = '#000';
gameOverPopup.style.border = '4px solid #fff';
gameOverPopup.style.fontFamily = "'Press Start 2P', monospace";
gameOverPopup.style.color = '#fff';
gameOverPopup.style.padding = '20px';
gameOverPopup.style.textAlign = 'center';
gameOverPopup.style.display = 'none';
gameOverPopup.style.zIndex = '1000';

const gameOverText = document.createElement('div');
gameOverText.textContent = 'GAME OVER';
gameOverText.style.fontSize = '24px';
gameOverText.style.marginBottom = '20px';
gameOverText.style.color = '#ff0000';
gameOverPopup.appendChild(gameOverText);

const finalScoreText = document.createElement('div');
finalScoreText.style.fontSize = '16px';
finalScoreText.style.marginBottom = '30px';
finalScoreText.style.lineHeight = '1.8';
gameOverPopup.appendChild(finalScoreText);

const tryAgainButton = document.createElement('button');
tryAgainButton.textContent = 'TRY AGAIN';
tryAgainButton.style.backgroundColor = '#000';
tryAgainButton.style.color = '#fff';
tryAgainButton.style.border = '2px solid #fff';
tryAgainButton.style.padding = '10px 20px';
tryAgainButton.style.margin = '10px';
tryAgainButton.style.fontFamily = "'Press Start 2P', monospace";
tryAgainButton.style.fontSize = '12px';
tryAgainButton.style.cursor = 'pointer';
tryAgainButton.addEventListener('mouseenter', () => {
    tryAgainButton.style.backgroundColor = '#fff';
    tryAgainButton.style.color = '#000';
});
tryAgainButton.addEventListener('mouseleave', () => {
    tryAgainButton.style.backgroundColor = '#000';
    tryAgainButton.style.color = '#fff';
});
tryAgainButton.addEventListener('click', resetGame);
gameOverPopup.appendChild(tryAgainButton);

const lobbyButton = document.createElement('button');
lobbyButton.textContent = 'BACK TO LOBBY';
lobbyButton.style.backgroundColor = '#000';
lobbyButton.style.color = '#fff';
lobbyButton.style.border = '2px solid #fff';
lobbyButton.style.padding = '10px 20px';
lobbyButton.style.margin = '10px';
lobbyButton.style.fontFamily = "'Press Start 2P', monospace";
lobbyButton.style.fontSize = '12px';
lobbyButton.style.cursor = 'pointer';
lobbyButton.addEventListener('mouseenter', () => {
    lobbyButton.style.backgroundColor = '#fff';
    lobbyButton.style.color = '#000';
});
lobbyButton.addEventListener('mouseleave', () => {
    lobbyButton.style.backgroundColor = '#000';
    lobbyButton.style.color = '#fff';
});
lobbyButton.addEventListener('click', goToLobby);
gameOverPopup.appendChild(lobbyButton);

document.body.appendChild(gameOverPopup);

function blinkGameOverText() {
    if (isBlinking) return;
    
    isBlinking = true;
    const blinkInterval = setInterval(() => {
        if (gameOverText.style.visibility === 'hidden') {
            gameOverText.style.visibility = 'visible';
        } else {
            gameOverText.style.visibility = 'hidden';
        }
    }, 700);
}

function createEnemy() {
    if (!gameActive) return;
    
    const enemy = new THREE.Group();
    const body = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.add(body);

    const wingGeometry = new THREE.BoxGeometry(1.8, 0.2, 0.4);
    const wing = new THREE.Mesh(wingGeometry, enemyMaterial);
    wing.position.y = -0.2;
    enemy.add(wing);
    
    enemy.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 4,
        -30
    );
    
    // collision box for better hit detection
    enemy.userData = {
        collisionBox: new THREE.Box3().setFromObject(enemy)
    };
    
    scene.add(enemy);
    enemies.push(enemy);
}

function resetGame() {
    for (let enemy of enemies) {
        scene.remove(enemy);
    }
    enemies.length = 0;
    
    for (let bullet of bullets) {
        scene.remove(bullet);
    }
    bullets.length = 0;
    player.position.set(0, 0, 5);
    
    // player visible again-- FIXED
    player.visible = true;
    score = 0;
    scoreElement.textContent = `SCORE: ${formatScore(score)}`;
    gameOverPopup.style.display = 'none';
    gameActive = true;
    isBlinking = false;
}

function goToLobby() {
    localStorage.setItem('totalSpaceScore', totalScore);
    window.location.href = '/';
    resetGame();
}

const enemyInterval = setInterval(createEnemy, 1500);

const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && gameActive) {
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        // align bullet with the player's position
        bullet.position.copy(player.position);
        // move bullet to the front of the ship
        bullet.position.z -= 1;
        
        scene.add(bullet);
        bullets.push(bullet);
        playSound('shoot');
    }
});

document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

//GAME SOUNDS
function playSound(type) {
    const oscillator = new (window.AudioContext || window.webkitAudioContext)().createOscillator();
    const gainNode = oscillator.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(oscillator.context.destination);
    
    if (type === 'shoot') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, oscillator.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            110, oscillator.context.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(0.1, oscillator.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, oscillator.context.currentTime + 0.1
        );
        
        oscillator.start();
        oscillator.stop(oscillator.context.currentTime + 0.1);
    } else if (type === 'explosion') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, oscillator.context.currentTime);
        gainNode.gain.setValueAtTime(0.3, oscillator.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, oscillator.context.currentTime + 0.3
        );
        
        oscillator.start();
        oscillator.stop(oscillator.context.currentTime + 0.3);
    } else if (type === 'gameOver') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, oscillator.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            55, oscillator.context.currentTime + 1
        );
        gainNode.gain.setValueAtTime(0.3, oscillator.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, oscillator.context.currentTime + 1
        );
        
        oscillator.start();
        oscillator.stop(oscillator.context.currentTime + 1);
    }
}

function gameOver() {
    gameActive = false;
    playSound('gameOver');
    totalScore += score
    finalScoreText.innerHTML = `FINAL SCORE: ${formatScore(score)}<br>TOTAL SCORE: ${formatScore(totalScore)}`;
    gameOverPopup.style.display = 'block';
    blinkGameOverText();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceShooterHighScore', highScore);
        highScoreElement.textContent = `HI-SCORE: ${formatScore(highScore)}`;
    }
}

function createPixelExplosion(position, size, color) {
    const particles = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshBasicMaterial({ 
                color: color,
                transparent: true,
                opacity: 1.0
            })
        );
        
        particle.position.copy(position);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            ),
            life: 30
        };
        
        scene.add(particle);
        particles.push(particle);
    }

    function animateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.position.add(particle.userData.velocity);
            particle.userData.life--;
            
            if (particle.material.opacity > 0) {
                particle.material.opacity -= 0.03;
            }
            
            if (particle.userData.life <= 0) {
                scene.remove(particle);
                particles.splice(i, 1);
            }
        }
        
        if (particles.length > 0) {
            requestAnimationFrame(animateParticles);
        }
    }
    
    animateParticles();
}

function checkCollision(object1, object2) {
    const box1 = new THREE.Box3().setFromObject(object1);
    const box2 = new THREE.Box3().setFromObject(object2);
    return box1.intersectsBox(box2);
}

function animate() {
    requestAnimationFrame(animate);
    if(!gameActive) return;

    if (gameActive) {
        if (keys['a'] || keys['arrowleft']) player.position.x -= 0.3;
        if (keys['d'] || keys['arrowright']) player.position.x += 0.3;
        if (keys['w'] || keys['arrowup']) player.position.y += 0.3;
        if (keys['s'] || keys['arrowdown']) player.position.y -= 0.3;

        player.position.x = Math.max(-8, Math.min(8, player.position.x));
        player.position.y = Math.max(-3, Math.min(3, player.position.y));

        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].position.z -= 0.8;
            if (bullets[i].position.z < -30) {
                scene.remove(bullets[i]);
                bullets.splice(i, 1);
                continue;
            }

            //collision detection
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (bullets[i] && enemies[j] && checkCollision(bullets[i], enemies[j])) {
                    createPixelExplosion(enemies[j].position, 0.3, 0xff6600);
                    playSound('explosion');

                    scene.remove(bullets[i]);
                    scene.remove(enemies[j]);
                    bullets.splice(i, 1);
                    enemies.splice(j, 1);
                    score += 5;
                    scoreElement.textContent = `SCORE: ${score}`;
                    break;
                }
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].position.z += 0.2;
            enemies[i].position.x += Math.sin(Date.now() * 0.001 + i) * 0.03;
            enemies[i].userData.collisionBox.setFromObject(enemies[i]);

            if (enemies[i].position.z > 10) {
                scene.remove(enemies[i]);
                enemies.splice(i, 1);
                continue;
            }

            if (enemies[i] && checkCollision(player, enemies[i])) {
                createPixelExplosion(player.position, 0.5, 0xff0000);
                player.visible = false;
                gameOver();
                break;
            }
        }
        stars.rotation.y += 0.001;
    }
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, orthoCamera);
}

animate();
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// arcade cabinet overlay
const arcadeOverlay = document.createElement('div');
arcadeOverlay.style.position = 'fixed';
arcadeOverlay.style.top = '0';
arcadeOverlay.style.left = '0';
arcadeOverlay.style.width = '100%';
arcadeOverlay.style.height = '100%';
arcadeOverlay.style.pointerEvents = 'none';
arcadeOverlay.style.borderRadius = '20% / 10%';
arcadeOverlay.style.boxShadow = 'inset 0 0 40px 40px rgba(0,0,0,0.7)';
arcadeOverlay.style.zIndex = '10';
document.body.appendChild(arcadeOverlay);

const scanlines = document.createElement('div');
scanlines.style.position = 'fixed';
scanlines.style.top = '0';
scanlines.style.left = '0';
scanlines.style.width = '100%';
scanlines.style.height = '100%';
scanlines.style.backgroundImage = 'linear-gradient(to bottom, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 50%)';
scanlines.style.backgroundSize = '100% 4px';
scanlines.style.pointerEvents = 'none';
scanlines.style.zIndex = '5';
scanlines.style.opacity = '0.3';
document.body.appendChild(scanlines);
